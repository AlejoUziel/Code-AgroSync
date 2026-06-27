import { randomUUID } from "crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { isDatabaseConfigured, query } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { readSession } from "@/lib/session";
import type { Empresa, EstadoUsuario, RolUsuario, Usuario } from "@/types/models";

interface UserRow extends RowDataPacket {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: string;
  empresa_id: string;
  estado: string;
  fecha_creacion: Date | string;
  ultimo_acceso: Date | string | null;
}

interface CompanyRow extends RowDataPacket {
  id: string;
  nombre: string;
  nit: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  pais: string;
  plan: string;
  estado: string;
  fecha_registro: Date | string;
  notas: string | null;
}

type UserPayload = Partial<Usuario> & {
  password?: string;
  confirmPassword?: string;
};
type CompanyPayload = Partial<Empresa>;

function iso(value: Date | string | null) {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : String(value);
}

function userFromRow(row: UserRow) {
  return {
    id: row.id,
    nombre: row.nombre,
    apellido: row.apellido,
    email: row.email,
    telefono: row.telefono,
    rol: row.rol,
    empresaId: row.empresa_id,
    estado: row.estado,
    fechaCreacion: iso(row.fecha_creacion) ?? "",
    ultimoAcceso: iso(row.ultimo_acceso),
  };
}

function companyFromRow(row: CompanyRow) {
  return {
    id: row.id,
    nombre: row.nombre,
    nit: row.nit,
    email: row.email,
    telefono: row.telefono,
    direccion: row.direccion,
    ciudad: row.ciudad,
    pais: row.pais,
    plan: row.plan,
    estado: row.estado,
    fechaRegistro: iso(row.fecha_registro) ?? "",
    notas: row.notas ?? "",
  };
}

function departamentoForRole(rol?: string) {
  if (rol === "Administrador" || rol === "Administrador IT") return "AdministradorIT";
  if (rol === "Gerente de Campo" || rol === "Supervisor" || rol === "Operador" || rol === "Jornalero") return "Operativo";
  if (rol === "Analista") return "Tecnologico";
  return "Administrativo";
}

function validateUserPayload(body: UserPayload, isEditing = false) {
  const errors: string[] = [];
  if (!body.nombre?.trim()) errors.push("El nombre es requerido.");
  if (!body.apellido?.trim()) errors.push("El apellido es requerido.");
  if (!body.email?.trim()) errors.push("El correo es requerido.");
  if (!body.telefono?.trim()) errors.push("El telefono es requerido.");
  if (!body.empresaId?.trim()) errors.push("La empresa es requerida.");
  if (!body.rol) errors.push("El rol es requerido.");
  if (!body.estado) errors.push("El estado es requerido.");
  if (!isEditing || body.password || body.confirmPassword) {
    if (!body.password) errors.push("La contraseña es requerida.");
    else if (body.password.length < 8) errors.push("La contraseña debe tener al menos 8 caracteres.");
    if (!body.confirmPassword) errors.push("Confirma la contraseña.");
    else if (body.password !== body.confirmPassword) errors.push("Las contraseñas no coinciden.");
  }
  return errors;
}

function validateCompanyPayload(body: CompanyPayload) {
  const errors: string[] = [];
  if (!body.nombre?.trim()) errors.push("El nombre de la empresa es requerido.");
  if (!body.nit?.trim()) errors.push("El NIT / RUC es requerido.");
  if (!body.email?.trim()) errors.push("El correo de la empresa es requerido.");
  if (!body.telefono?.trim()) errors.push("El telefono de la empresa es requerido.");
  if (!body.ciudad?.trim()) errors.push("La ciudad de la empresa es requerida.");
  return errors;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = `%${(url.searchParams.get("q") ?? "").trim()}%`;
  const tab = url.searchParams.get("tab") === "empresas" ? "empresas" : "usuarios";

  if (!isDatabaseConfigured) {
    return Response.json({ dbConfigured: false, items: [] });
  }

  if (tab === "empresas") {
    const rows = await query<CompanyRow[]>(
      `SELECT id, nombre, nit, email, telefono, direccion, ciudad, pais, plan, estado, fecha_registro, notas
       FROM empresas
       WHERE nombre LIKE :q OR nit LIKE :q OR email LIKE :q OR ciudad LIKE :q
       ORDER BY nombre
       LIMIT 100`,
      { q }
    );

    return Response.json({
      dbConfigured: true,
      items: rows.map(companyFromRow),
    });
  }

  const rows = await query<UserRow[]>(
    `SELECT id, nombre, apellido, email, telefono, rol, empresa_id, estado, fecha_creacion, ultimo_acceso
     FROM usuarios
     WHERE nombre LIKE :q OR apellido LIKE :q OR email LIKE :q OR rol LIKE :q
     ORDER BY nombre, apellido
     LIMIT 100`,
    { q }
  );

  return Response.json({
    dbConfigured: true,
    items: rows.map(userFromRow),
  });
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured) {
    return Response.json({ dbConfigured: false, message: "DATABASE_URL no esta configurada." }, { status: 503 });
  }

  const url = new URL(request.url);
  const session = await readSession();

  if (url.searchParams.get("tab") === "empresas") {
    const body = (await request.json()) as CompanyPayload;
    const errors = validateCompanyPayload(body);
    if (errors.length > 0) {
      return Response.json({ message: errors.join(" ") }, { status: 400 });
    }

    const existingCompany = await query<CompanyRow[]>(
      `SELECT id, nombre, nit, email, telefono, direccion, ciudad, pais, plan, estado, fecha_registro, notas
       FROM empresas
       WHERE nit = :nit OR email = :email
       LIMIT 1`,
      { nit: body.nit, email: String(body.email).toLowerCase().trim() }
    );

    if (existingCompany[0]) {
      return Response.json({ dbConfigured: true, item: companyFromRow(existingCompany[0]), reused: true });
    }

    let id = body.id || randomUUID();
    if (!body.id && session?.empresaId) {
      const existingSessionCompany = await query<CompanyRow[]>(
        `SELECT id, nombre, nit, email, telefono, direccion, ciudad, pais, plan, estado, fecha_registro, notas
         FROM empresas
         WHERE id = :id
         LIMIT 1`,
        { id: session.empresaId }
      );
      if (!existingSessionCompany[0]) id = session.empresaId;
    }
    const createdAt = body.fechaRegistro ? new Date(body.fechaRegistro) : new Date();

    try {
      await query<ResultSetHeader>(
        `INSERT INTO empresas (
           id, nombre, nit, email, telefono, direccion, ciudad, pais, plan, estado, fecha_registro, notas
         ) VALUES (
           :id, :nombre, :nit, :email, :telefono, :direccion, :ciudad, :pais, :plan, :estado, :fechaRegistro, :notas
         )`,
        {
          id,
          nombre: body.nombre,
          nit: body.nit,
          email: String(body.email).toLowerCase().trim(),
          telefono: body.telefono,
          direccion: body.direccion?.trim() || "Pendiente de completar",
          ciudad: body.ciudad,
          pais: body.pais ?? "Honduras",
          plan: body.plan ?? "Starter",
          estado: body.estado ?? "Activa",
          fechaRegistro: createdAt,
          notas: body.notas ?? null,
        }
      );
    } catch (error) {
      const message = error instanceof Error && error.message.includes("Duplicate")
        ? "Ya existe una empresa con ese NIT / RUC."
        : "No se pudo crear la empresa en MySQL.";
      return Response.json({ message }, { status: 400 });
    }

    const rows = await query<CompanyRow[]>(
      `SELECT id, nombre, nit, email, telefono, direccion, ciudad, pais, plan, estado, fecha_registro, notas
       FROM empresas
       WHERE id = :id
       LIMIT 1`,
      { id }
    );

    return Response.json({ dbConfigured: true, item: companyFromRow(rows[0]) }, { status: 201 });
  }

  const body = (await request.json()) as UserPayload;
  const errors = validateUserPayload(body);
  if (errors.length > 0) {
    return Response.json({ message: errors.join(" ") }, { status: 400 });
  }

  const id = body.id || randomUUID();
  const createdAt = body.fechaCreacion ? new Date(body.fechaCreacion) : new Date();
  const existingUser = await query<UserRow[]>(
    `SELECT id, nombre, apellido, email, telefono, rol, empresa_id, estado, fecha_creacion, ultimo_acceso
     FROM usuarios
     WHERE email = :email
     LIMIT 1`,
    { email: String(body.email).toLowerCase().trim() }
  );

  if (existingUser[0]) {
    return Response.json(
      { message: "Ya existe un usuario con ese correo. Edita el usuario existente para cambiar su contraseña o permisos." },
      { status: 409 }
    );
  }

  try {
    await query<ResultSetHeader>(
      `INSERT INTO usuarios (
         id, empresa_id, nombre, apellido, email, telefono, rol, departamento,
         estado, password_hash, fecha_creacion, ultimo_acceso, notas
       ) VALUES (
         :id, :empresaId, :nombre, :apellido, :email, :telefono, :rol, :departamento,
         :estado, :passwordHash, :fechaCreacion, NULL, :notas
       )`,
      {
        id,
        empresaId: body.empresaId,
        nombre: body.nombre,
        apellido: body.apellido,
        email: String(body.email).toLowerCase().trim(),
        telefono: body.telefono,
        rol: body.rol as RolUsuario,
        departamento: departamentoForRole(body.rol),
        estado: body.estado as EstadoUsuario,
        passwordHash: hashPassword(String(body.password)),
        fechaCreacion: createdAt,
        notas: body.notas ?? null,
      }
    );
  } catch (error) {
    const message = error instanceof Error && error.message.includes("Duplicate")
      ? "Ya existe un usuario con ese correo."
      : "No se pudo crear el usuario en MySQL.";
    return Response.json({ message }, { status: 400 });
  }

  const rows = await query<UserRow[]>(
    `SELECT id, nombre, apellido, email, telefono, rol, empresa_id, estado, fecha_creacion, ultimo_acceso
     FROM usuarios
     WHERE id = :id
     LIMIT 1`,
    { id }
  );

  return Response.json({ dbConfigured: true, item: userFromRow(rows[0]) }, { status: 201 });
}

export async function PUT(request: Request) {
  if (!isDatabaseConfigured) {
    return Response.json({ dbConfigured: false, message: "DATABASE_URL no esta configurada." }, { status: 503 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const body = (await request.json()) as UserPayload;

  if (!id) {
    return Response.json({ message: "ID de usuario requerido." }, { status: 400 });
  }

  const errors = validateUserPayload(body, true);
  if (errors.length > 0) {
    return Response.json({ message: errors.join(" ") }, { status: 400 });
  }

  try {
    const duplicateUser = await query<UserRow[]>(
      `SELECT id, nombre, apellido, email, telefono, rol, empresa_id, estado, fecha_creacion, ultimo_acceso
       FROM usuarios
       WHERE email = :email AND id <> :id
       LIMIT 1`,
      { id, email: String(body.email).toLowerCase().trim() }
    );

    if (duplicateUser[0]) {
      return Response.json(
        { message: "Ese correo ya pertenece a otro usuario. Usa editar para el usuario existente y evita duplicados." },
        { status: 409 }
      );
    }

    const shouldUpdatePassword = Boolean(body.password);
    await query<ResultSetHeader>(
      `UPDATE usuarios
       SET empresa_id = :empresaId,
           nombre = :nombre,
           apellido = :apellido,
           email = :email,
           telefono = :telefono,
           rol = :rol,
           departamento = :departamento,
           estado = :estado,
           notas = :notas
           ${shouldUpdatePassword ? ", password_hash = :passwordHash, intentos_fallidos = 0, bloqueado_en = NULL" : ""}
       WHERE id = :id`,
      {
        id,
        empresaId: body.empresaId,
        nombre: body.nombre,
        apellido: body.apellido,
        email: String(body.email).toLowerCase().trim(),
        telefono: body.telefono,
        rol: body.rol as RolUsuario,
        departamento: departamentoForRole(body.rol),
        estado: body.estado as EstadoUsuario,
        notas: body.notas ?? null,
        passwordHash: shouldUpdatePassword ? hashPassword(String(body.password)) : undefined,
      }
    );
  } catch (error) {
    const message = error instanceof Error && error.message.includes("Duplicate")
      ? "Ya existe un usuario con ese correo."
      : "No se pudo actualizar el usuario en MySQL.";
    return Response.json({ message }, { status: 400 });
  }

  const rows = await query<UserRow[]>(
    `SELECT id, nombre, apellido, email, telefono, rol, empresa_id, estado, fecha_creacion, ultimo_acceso
     FROM usuarios
     WHERE id = :id
     LIMIT 1`,
    { id }
  );

  if (!rows[0]) {
    return Response.json({ message: "Usuario no encontrado." }, { status: 404 });
  }

  return Response.json({ dbConfigured: true, item: userFromRow(rows[0]) });
}

export async function DELETE(request: Request) {
  if (!isDatabaseConfigured) {
    return Response.json({ dbConfigured: false, message: "DATABASE_URL no esta configurada." }, { status: 503 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return Response.json({ message: "ID de usuario requerido." }, { status: 400 });
  }

  try {
    const result = await query<ResultSetHeader>("DELETE FROM usuarios WHERE id = :id", { id });
    if (result.affectedRows === 0) {
      return Response.json({ message: "Usuario no encontrado." }, { status: 404 });
    }
  } catch {
    return Response.json(
      { message: "No se pudo eliminar el usuario porque tiene registros relacionados." },
      { status: 409 }
    );
  }

  return Response.json({ dbConfigured: true, ok: true });
}
