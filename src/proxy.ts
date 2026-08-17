import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { cookieName } from "@/lib/session";
import { canAccessDepartamentoPath, departamentoHome } from "@/lib/departments";
import { getSessionSecret } from "@/lib/session-secret";

function clearInvalidSession(response: NextResponse) {
  response.cookies.delete(cookieName);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(cookieName)?.value;
  const isApiRequest = pathname.startsWith("/api/");
  const isMfaEnrollmentApi = pathname === "/api/session" || pathname === "/api/security/mfa";

  const publicAuthPage = pathname === "/login" || pathname === "/recuperar-contrasena" || pathname === "/restablecer-contrasena" || pathname === "/aceptar-invitacion";

  if (pathname === "/login" && token) {
    try {
      const { payload } = await jwtVerify(token, getSessionSecret());
      if (!Number.isInteger(Number(payload.sessionVersion))) {
        return clearInvalidSession(NextResponse.next());
      }
      if (payload.mfaEnrollmentRequired) {
        return NextResponse.redirect(new URL("/configuracion/seguridad", request.url));
      }
      return NextResponse.redirect(new URL(departamentoHome(String(payload.departamento ?? "")), request.url));
    } catch {
      return clearInvalidSession(NextResponse.next());
    }
  }

  if (publicAuthPage) {
    return NextResponse.next();
  }

  if (!token) {
    if (isApiRequest) return NextResponse.next();
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    if (!Number.isInteger(Number(payload.sessionVersion))) {
      return clearInvalidSession(isApiRequest ? NextResponse.next() : NextResponse.redirect(new URL("/login", request.url)));
    }
    if (payload.mfaEnrollmentRequired && pathname !== "/configuracion/seguridad" && !isMfaEnrollmentApi) {
      if (isApiRequest) {
        return NextResponse.json({ message: "Completa la configuracion MFA para continuar." }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/configuracion/seguridad", request.url));
    }
    if (pathname === "/" || ["/admin", "/ops", "/tech"].some((prefix) => pathname.startsWith(prefix))) {
      const isPlatformAdmin = payload.platformRole === "platform_admin";
      const isOrganizationAdmin = payload.rol === "Administrador";
      const isPlatformDirectory = pathname.startsWith("/admin/usuarios");
      const allowed = isPlatformAdmin || (isOrganizationAdmin && !isPlatformDirectory) || canAccessDepartamentoPath(String(payload.departamento ?? ""), pathname);
      if (!allowed || (isPlatformDirectory && !isPlatformAdmin)) {
        return NextResponse.redirect(new URL(departamentoHome(String(payload.departamento ?? "")), request.url));
      }
    }
    return NextResponse.next();
  } catch {
    return clearInvalidSession(isApiRequest ? NextResponse.next() : NextResponse.redirect(new URL("/login", request.url)));
  }
}

export const config = {
  matcher: ["/((?!api/health|api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
