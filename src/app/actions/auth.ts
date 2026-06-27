"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { isDatabaseConfigured, query } from "@/lib/db";
import { createSession, deleteSession, readSession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";
import { departamentoHome, normalizeDepartamento } from "@/lib/departments";

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
};

const localUsersCookie = "agrosync_local_users";
const maxLoginAttempts = 5;

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

function roleForDepartment(departamento: string) {
  return normalizeDepartamento(departamento) === "AdministradorIT" ? "Administrador IT" : "Administrador";
}

function adminPasswordIsValid(value: string) {
  return value === (process.env.ADMIN_GENERAL_PASSWORD ?? "AgroSyncAdmin2026!");
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

  await ensureLoginSecurityColumns();

  const rows = await query<AuthUserRow[]>(
    `SELECT id, nombre, apellido, email, rol, departamento, empresa_id, estado, password_hash, intentos_fallidos
     FROM usuarios
     WHERE email = :email
     LIMIT 1`,
    { email }
  );

  return rows[0] ?? null;
}

async function ensureLoginSecurityColumns() {
  if (!isDatabaseConfigured) return;
  await query<ResultSetHeader>(
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS intentos_fallidos INT NOT NULL DEFAULT 0 AFTER password_hash"
  );
  await query<ResultSetHeader>(
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bloqueado_en DATETIME NULL AFTER intentos_fallidos"
  );
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
  const attempts = Number(user.intentos_fallidos ?? 0) + 1;
  if (attempts >= maxLoginAttempts) {
    await query<ResultSetHeader>(
      "UPDATE usuarios SET estado = 'Suspendido', intentos_fallidos = :attempts, bloqueado_en = CURRENT_TIMESTAMP WHERE id = :id",
      { id: user.id, attempts: maxLoginAttempts }
    );
    await createSupportAlertForBlockedUser(user, maxLoginAttempts);
    return `Usuario bloqueado por superar ${maxLoginAttempts} intentos. Comunicate con soporte tecnico.`;
  }

  await query<ResultSetHeader>(
    "UPDATE usuarios SET intentos_fallidos = :attempts WHERE id = :id",
    { id: user.id, attempts }
  );
  return `Credenciales invalidas. Intento ${attempts} de ${maxLoginAttempts}.`;
}

async function resetDatabaseFailedAttempts(userId: string) {
  await query<ResultSetHeader>(
    "UPDATE usuarios SET intentos_fallidos = 0, bloqueado_en = NULL, ultimo_acceso = CURRENT_TIMESTAMP WHERE id = :id",
    { id: userId }
  );
}

async function createCompany(nombre: string, email: string, telefono: string) {
  const id = randomUUID();
  await query<ResultSetHeader>(
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

  if (!isDatabaseConfigured) {
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
    });
    redirect(departamentoHome(localUser.departamento));
  }

  let redirectTo = "/";
  try {
    const user = await findUser(email);
    if (!user) {
      return { message: "Credenciales invalidas o usuario inactivo." };
    }

    if (user.estado !== "Activo") {
      return { message: "Usuario bloqueado o inactivo. Comunicate con soporte tecnico." };
    }

    if (!verifyPassword(password, user.password_hash)) {
      return { message: await registerDatabaseFailedAttempt(user) };
    }

    await createSession({
      userId: user.id,
      email: user.email,
      nombre: `${user.nombre} ${user.apellido}`,
      rol: user.rol,
      departamento: normalizeDepartamento(user.departamento),
      empresaId: user.empresa_id,
    });
    redirectTo = departamentoHome(user.departamento);

    await resetDatabaseFailedAttempts(user.id);
  } catch {
    return { message: "No se pudo validar el acceso con la base de datos." };
  }

  redirect(redirectTo);
}

export async function register(_state: RegisterState, formData: FormData): Promise<RegisterState> {
  const data = {
    nombre: String(formData.get("nombre") ?? "").trim(),
    apellido: String(formData.get("apellido") ?? "").trim(),
    email: String(formData.get("email") ?? "").toLowerCase().trim(),
    telefono: String(formData.get("telefono") ?? "").trim(),
    empresa: String(formData.get("empresa") ?? "").trim(),
    departamento: normalizeDepartamento(String(formData.get("departamento") ?? "")),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
  const errors = validateRegister(data);

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  if (!isDatabaseConfigured) {
    const users = await getLocalUsers();
    if (users.some((user) => user.email === data.email)) {
      return { errors: { email: "Ya existe un usuario con este correo." } };
    }
    const userId = `LOCAL-${randomUUID()}`;
    const empresaId = `LOCAL-${randomUUID()}`;
    const rol = roleForDepartment(data.departamento);
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
    });
    redirect(departamentoHome(data.departamento));
  }

  try {
    const existingUser = await findUser(data.email);
    if (existingUser) {
      return { errors: { email: "Ya existe un usuario con este correo." } };
    }

    const empresaId = await createCompany(data.empresa, data.email, data.telefono);
    const userId = randomUUID();

    await query<ResultSetHeader>(
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
        rol: roleForDepartment(data.departamento),
        departamento: data.departamento,
        passwordHash: hashPassword(data.password),
        notas: "Usuario creado desde el login.",
      }
    );

    await createSession({
      userId,
      email: data.email,
      nombre: `${data.nombre} ${data.apellido}`,
      rol: roleForDepartment(data.departamento),
      departamento: data.departamento,
      empresaId,
    });
  } catch {
    return { message: "No se pudo crear el usuario. Revisa la conexion y el esquema de MySQL." };
  }

  redirect(departamentoHome(data.departamento));
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

  if (isDatabaseConfigured) {
    const [firstName, ...rest] = nombre.split(" ");
    await query<ResultSetHeader>(
      "UPDATE usuarios SET nombre = :nombre, apellido = :apellido, rol = :rol, departamento = :departamento WHERE id = :id",
      {
        id: session.userId,
        nombre: firstName || nombre,
        apellido: rest.join(" "),
        rol,
        departamento,
      }
    );
  } else {
    const users = await getLocalUsers();
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
        };
      })
    );
  }

  await createSession({
    ...session,
    nombre,
    rol,
    departamento,
  });

  return { ok: true, message: "Usuario actualizado correctamente." };
}
