"use server";

import { redirect } from "next/navigation";
import { createHash, randomUUID, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { isDatabaseConfigured, query, withTransaction, type QueryExecutor, type ResultSetHeader, type RowDataPacket } from "@/lib/db";
import { createSession, deleteSession, readSession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";
import { departamentoHome, normalizeDepartamento } from "@/lib/departments";
import { publicRegistrationIdentity, roleForDepartment } from "@/lib/auth-policy";

export type LoginState = {
  errors?: Partial<Record<"email" | "password", string>>;
  message?: string;
};

export type RegisterState = {
  errors?: Partial<
    Record<
      "nombre" | "apellido" | "email" | "telefono" | "empresa" | "departamento" | "password" | "confirmPassword",
      string
    >
  >;
  message?: string;
};

export type SettingsState = {
  message?: string;
  ok?: boolean;
};

interface AuthUserRow extends RowDataPacket {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  departamento: string;
  empresa_id: string;
  estado: string;
  password_hash: string;
  intentos_fallidos: number;
  session_version: number;
}

type LocalUser = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  empresa: string;
  rol: string;
  departamento: string;
  empresaId: string;
  estado: string;
  password_hash: string;
  intentosFallidos?: number;
  bloqueadoEn?: string;
  sessionVersion: number;
};

const localUsersCookie = "agrosync_local_users";
const maxLoginAttempts = 5;
const allowLocalAuth = process.env.NODE_ENV !== "production";

async function getLocalUsers() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(localUsersCookie)?.value;
  if (!raw) return [] as LocalUser[];
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as LocalUser[];
  } catch {
    return [] as LocalUser[];
  }
}

async function saveLocalUsers(users: LocalUser[]) {
  const cookieStore = await cookies();
  cookieStore.set(localUsersCookie, Buffer.from(JSON.stringify(users), "utf8").toString("base64url"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

function adminPasswordIsValid(value: string) {
  const expected = process.env.ADMIN_GENERAL_PASSWORD;
  if (!expected || expected.length < 12 || !value) return false;
  const actualBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

async function loginRateKey(email: string) {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || requestHeaders.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${ip}:${email}`).digest("hex");
}

async function rateLimitMessage(key: string) {
  if (!isDatabaseConfigured) return null;
  const rows = await query<(RowDataPacket & { bloqueado_hasta: Date | string | null })[]>(
    "SELECT bloqueado_hasta FROM auth_rate_limits WHERE key_hash = :key AND bloqueado_hasta > CURRENT_TIMESTAMP",
    { key }
  );
  return rows[0] ? "Demasiados intentos. Espera 15 minutos antes de volver a intentar." : null;
}

async function recordRateLimitFailure(key: string) {
  if (!isDatabaseConfigured) return;
  await query<ResultSetHeader>(
    `INSERT INTO auth_rate_limits (key_hash, intentos, ventana_iniciada, bloqueado_hasta)
     VALUES (:key, 1, CURRENT_TIMESTAMP, NULL)
     ON CONFLICT (key_hash) DO UPDATE SET
       intentos = CASE WHEN auth_rate_limits.ventana_iniciada < CURRENT_TIMESTAMP - INTERVAL '15 minutes' THEN 1 ELSE auth_rate_limits.intentos + 1 END,
       ventana_iniciada = CASE WHEN auth_rate_limits.ventana_iniciada < CURRENT_TIMESTAMP - INTERVAL '15 minutes' THEN CURRENT_TIMESTAMP ELSE auth_rate_limits.ventana_iniciada END,
       bloqueado_hasta = CASE
         WHEN (CASE WHEN auth_rate_limits.ventana_iniciada < CURRENT_TIMESTAMP - INTERVAL '15 minutes' THEN 1 ELSE auth_rate_limits.intentos + 1 END) >= 10
         THEN CURRENT_TIMESTAMP + INTERVAL '15 minutes'
         ELSE auth_rate_limits.bloqueado_hasta
       END`,
    { key }
  );
}

async function clearRateLimit(key: string) {
  if (isDatabaseConfigured) {
    await query<ResultSetHeader>("DELETE FROM auth_rate_limits WHERE key_hash = :key", { key });
  }
}

function validateLogin(email: string, password: string) {
  const errors: LoginState["errors"] = {};
  if (!email.trim()) errors.email = "Ingresa tu correo.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Correo invalido.";

  if (!password) errors.password = "Ingresa tu contrasena.";
  else if (password.length < 8) errors.password = "Debe tener al menos 8 caracteres.";

  return errors;
}

function validateRegister(data: {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  empresa: string;
  departamento: string;
  password: string;
  confirmPassword: string;
}) {
  const errors: RegisterState["errors"] = {};
  if (!data.nombre.trim()) errors.nombre = "Ingresa tu nombre.";
  if (!data.apellido.trim()) errors.apellido = "Ingresa tu apellido.";
  if (!data.email.trim()) errors.email = "Ingresa tu correo.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Correo invalido.";
  if (!data.telefono.trim()) errors.telefono = "Ingresa tu telefono.";
  if (!data.empresa.trim()) errors.empresa = "Ingresa el nombre de la empresa.";
  if (!data.departamento.trim()) {
    errors.departamento = "Selecciona el departamento.";
  }
  if (!data.password) errors.password = "Crea una contrasena.";
  else if (data.password.length < 8) errors.password = "Debe tener al menos 8 caracteres.";
  if (!data.confirmPassword) errors.confirmPassword = "Confirma tu contrasena.";
  else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Las contrasenas no coinciden.";
  }
  return errors;
}

async function findUser(email: string) {
  if (!isDatabaseConfigured) return null;

  const rows = await query<AuthUserRow[]>(
    `SELECT id, nombre, apellido, email, rol, departamento, empresa_id, estado, password_hash, intentos_fallidos, session_version
     FROM usuarios
     WHERE email = :email
     LIMIT 1`,
    { email }
  );

  return rows[0] ?? null;
}

async function createSupportAlertForBlockedUser(user: AuthUserRow, attempts: number) {
  try {
    await query<ResultSetHeader>(
      `INSERT INTO alertas (
         id, empresa_id, tipo, severidad, mensaje, resuelta
       ) VALUES (
         :id, :empresaId, 'Seguridad', 'Alta', :mensaje, FALSE
       )`,
      {
        id: randomUUID(),
        empresaId: user.empresa_id,
        mensaje: `Soporte tecnico: usuario ${user.nombre} ${user.apellido} (${user.email}) bloqueado por superar ${attempts} intentos fallidos de inicio de sesion.`,
      }
    );
  } catch {
    // El bloqueo del usuario no debe depender de que la alerta interna se guarde.
  }
}

async function registerDatabaseFailedAttempt(user: AuthUserRow) {
  const rows = await query<(RowDataPacket & { intentos_fallidos: number; estado: string })[]>(
    `UPDATE usuarios
     SET intentos_fallidos = LEAST(intentos_fallidos + 1, :maxAttempts),
         estado = CASE WHEN intentos_fallidos + 1 >= :maxAttempts THEN 'Suspendido' ELSE estado END,
         bloqueado_en = CASE WHEN intentos_fallidos + 1 >= :maxAttempts THEN CURRENT_TIMESTAMP ELSE bloqueado_en END
     WHERE id = :id
     RETURNING intentos_fallidos, estado`,
    { id: user.id, maxAttempts: maxLoginAttempts }
  );
  const attempts = Number(rows[0]?.intentos_fallidos ?? maxLoginAttempts);
  if (attempts >= maxLoginAttempts) {
    await createSupportAlertForBlockedUser(user, maxLoginAttempts);
    return `Usuario bloqueado por superar ${maxLoginAttempts} intentos. Comunicate con soporte tecnico.`;
  }
  return `Credenciales invalidas. Intento ${attempts} de ${maxLoginAttempts}.`;
}

async function resetDatabaseFailedAttempts(userId: string) {
  await query<ResultSetHeader>(
    "UPDATE usuarios SET intentos_fallidos = 0, bloqueado_en = NULL, ultimo_acceso = CURRENT_TIMESTAMP WHERE id = :id",
    { id: userId }
  );
}

async function createCompany(execute: QueryExecutor, nombre: string, email: string, telefono: string) {
  const id = randomUUID();
  await execute<ResultSetHeader>(
    `INSERT INTO empresas (
       id, nombre, nit, email, telefono, direccion, ciudad, pais, plan, estado, notas
     ) VALUES (
       :id, :nombre, :nit, :email, :telefono, :direccion, :ciudad, 'Honduras', 'Starter', 'Activa', :notas
     )`,
    {
      id,
      nombre,
      nit: `REG-${id.slice(0, 8).toUpperCase()}`,
      email,
      telefono,
      direccion: "Pendiente de completar",
      ciudad: "Tegucigalpa",
      notas: "Creada desde el registro de acceso.",
    }
  );
  return id;
}

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const errors = validateLogin(email, password);

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const rateKey = await loginRateKey(email);
  const limited = await rateLimitMessage(rateKey);
  if (limited) return { message: limited };

  if (!isDatabaseConfigured) {
    if (!allowLocalAuth) {
      return { message: "La base compartida no esta disponible. El acceso local esta deshabilitado en produccion." };
    }
    const users = await getLocalUsers();
    const localUser = users.find((user) => user.email === email);
    if (!localUser) {
      return { message: "Credenciales invalidas o usuario inactivo." };
    }

    if (localUser.estado !== "Activo") {
      return { message: "Usuario bloqueado o inactivo. Comunicate con soporte tecnico." };
    }

    if (!verifyPassword(password, localUser.password_hash)) {
      const attempts = Number(localUser.intentosFallidos ?? 0) + 1;
      const shouldBlock = attempts >= maxLoginAttempts;
      await saveLocalUsers(
        users.map((user) =>
          user.email === email
            ? {
                ...user,
                estado: shouldBlock ? "Suspendido" : user.estado,
                intentosFallidos: shouldBlock ? maxLoginAttempts : attempts,
                bloqueadoEn: shouldBlock ? new Date().toISOString() : user.bloqueadoEn,
              }
            : user
        )
      );

      if (shouldBlock) {
        return { message: `Usuario bloqueado por superar ${maxLoginAttempts} intentos. Comunicate con soporte tecnico.` };
      }

      return { message: `Credenciales invalidas. Intento ${attempts} de ${maxLoginAttempts}.` };
    }

    await saveLocalUsers(
      users.map((user) => (user.email === email ? { ...user, intentosFallidos: 0, bloqueadoEn: undefined } : user))
    );
    await createSession({
      userId: localUser.id,
      email: localUser.email,
      nombre: `${localUser.nombre} ${localUser.apellido}`,
      rol: localUser.rol,
      departamento: normalizeDepartamento(localUser.departamento),
      empresaId: localUser.empresaId,
      sessionVersion: Number(localUser.sessionVersion ?? 1),
    });
    redirect(departamentoHome(localUser.departamento));
  }

  let redirectTo = "/";
  try {
    const user = await findUser(email);
    if (!user) {
      await recordRateLimitFailure(rateKey);
      return { message: "Credenciales invalidas o usuario inactivo." };
    }

    if (user.estado !== "Activo") {
      return { message: "Usuario bloqueado o inactivo. Comunicate con soporte tecnico." };
    }

    if (!verifyPassword(password, user.password_hash)) {
      await recordRateLimitFailure(rateKey);
      return { message: await registerDatabaseFailedAttempt(user) };
    }

    await createSession({
      userId: user.id,
      email: user.email,
      nombre: `${user.nombre} ${user.apellido}`,
      rol: user.rol,
      departamento: normalizeDepartamento(user.departamento),
      empresaId: user.empresa_id,
      sessionVersion: Number(user.session_version),
    });
    redirectTo = departamentoHome(user.departamento);

    await resetDatabaseFailedAttempts(user.id);
    await clearRateLimit(rateKey);
  } catch {
    return { message: "No se pudo validar el acceso con la base de datos." };
  }

  redirect(redirectTo);
}

export async function register(_state: RegisterState, formData: FormData): Promise<RegisterState> {
  const publicIdentity = publicRegistrationIdentity();
  const data = {
    nombre: String(formData.get("nombre") ?? "").trim(),
    apellido: String(formData.get("apellido") ?? "").trim(),
    email: String(formData.get("email") ?? "").toLowerCase().trim(),
    telefono: String(formData.get("telefono") ?? "").trim(),
    empresa: String(formData.get("empresa") ?? "").trim(),
    departamento: publicIdentity.departamento,
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
  const errors = validateRegister(data);

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  if (!isDatabaseConfigured) {
    if (!allowLocalAuth) {
      return { message: "La base compartida no esta disponible. No se crearon datos locales." };
    }
    const users = await getLocalUsers();
    if (users.some((user) => user.email === data.email)) {
      return { errors: { email: "Ya existe un usuario con este correo." } };
    }
    const userId = `LOCAL-${randomUUID()}`;
    const empresaId = `LOCAL-${randomUUID()}`;
    const rol = publicIdentity.rol;
    await saveLocalUsers([
      ...users,
      {
        id: userId,
        empresaId,
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        telefono: data.telefono,
        empresa: data.empresa,
        rol,
        departamento: data.departamento,
        estado: "Activo",
        intentosFallidos: 0,
        sessionVersion: 1,
        password_hash: hashPassword(data.password),
      },
    ]);
    await createSession({
      userId,
      email: data.email,
      nombre: `${data.nombre} ${data.apellido}`,
      rol,
      departamento: data.departamento,
      empresaId,
      sessionVersion: 1,
    });
    redirect(departamentoHome(data.departamento));
  }

  try {
    const existingUser = await findUser(data.email);
    if (existingUser) {
      return { errors: { email: "Ya existe un usuario con este correo." } };
    }

    const { empresaId, userId } = await withTransaction(async (execute) => {
      const empresaId = await createCompany(execute, data.empresa, data.email, data.telefono);
      const userId = randomUUID();
      await execute<ResultSetHeader>(
        `INSERT INTO usuarios (
           id, empresa_id, nombre, apellido, email, telefono, rol, departamento, estado, password_hash, intentos_fallidos, notas
         ) VALUES (
           :id, :empresaId, :nombre, :apellido, :email, :telefono, :rol, :departamento, 'Activo', :passwordHash, 0, :notas
         )`,
        {
          id: userId,
          empresaId,
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          telefono: data.telefono,
          rol: publicIdentity.rol,
          departamento: data.departamento,
          passwordHash: hashPassword(data.password),
          notas: "Usuario creado desde el login.",
        }
      );
      return { empresaId, userId };
    });

    await createSession({
      userId,
      email: data.email,
      nombre: `${data.nombre} ${data.apellido}`,
      rol: publicIdentity.rol,
      departamento: data.departamento,
      empresaId,
      sessionVersion: 1,
    });
  } catch {
    return { message: "No se pudo crear el usuario. Revisa la conexion y el esquema de PostgreSQL." };
  }

  redirect(departamentoHome(publicIdentity.departamento));
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

export async function updateSessionProfile(_state: SettingsState, formData: FormData): Promise<SettingsState> {
  const adminPassword = String(formData.get("adminPassword") ?? "");
  if (!adminPasswordIsValid(adminPassword)) {
    return { message: "Validacion de administrador general incorrecta." };
  }

  const session = await readSession();
  if (!session) return { message: "No hay sesion activa." };

  const nombre = String(formData.get("nombre") ?? session.nombre).trim();
  const departamento = normalizeDepartamento(String(formData.get("departamento") ?? session.departamento));
  const rol = roleForDepartment(departamento);

  let nextSessionVersion = Number(session.sessionVersion);
  if (isDatabaseConfigured) {
    const [firstName, ...rest] = nombre.split(" ");
    const rows = await query<(RowDataPacket & { session_version: number })[]>(
      `UPDATE usuarios
       SET nombre = :nombre,
           apellido = :apellido,
           rol = :rol,
           departamento = :departamento,
           session_version = session_version + 1
       WHERE id = :id AND estado = 'Activo'
       RETURNING session_version`,
      {
        id: session.userId,
        nombre: firstName || nombre,
        apellido: rest.join(" "),
        rol,
        departamento,
      }
    );
    if (!rows[0]) return { message: "No se pudo actualizar un usuario activo." };
    nextSessionVersion = Number(rows[0].session_version);
  } else if (allowLocalAuth) {
    const users = await getLocalUsers();
    nextSessionVersion += 1;
    await saveLocalUsers(
      users.map((user) => {
        if (user.id !== session.userId) return user;
        const [firstName, ...rest] = nombre.split(" ");
        return {
          ...user,
          nombre: firstName || nombre,
          apellido: rest.join(" "),
          rol,
          departamento,
          sessionVersion: nextSessionVersion,
        };
      })
    );
  } else {
    return { message: "La base compartida no esta disponible. No se aplicaron cambios locales." };
  }

  await createSession({
    ...session,
    nombre,
    rol,
    departamento,
    sessionVersion: nextSessionVersion,
  });

  return { ok: true, message: "Usuario actualizado correctamente." };
}
