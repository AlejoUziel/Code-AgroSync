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

  if (pathname === "/login" && token) {
    try {
      const { payload } = await jwtVerify(token, getSessionSecret());
      if (!Number.isInteger(Number(payload.sessionVersion))) {
        return clearInvalidSession(NextResponse.next());
      }
      return NextResponse.redirect(new URL(departamentoHome(String(payload.departamento ?? "")), request.url));
    } catch {
      return clearInvalidSession(NextResponse.next());
    }
  }

  if (pathname === "/login") {
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    if (!Number.isInteger(Number(payload.sessionVersion))) {
      return clearInvalidSession(NextResponse.redirect(new URL("/login", request.url)));
    }
    if (pathname === "/" || ["/admin", "/ops", "/tech"].some((prefix) => pathname.startsWith(prefix))) {
      if (!canAccessDepartamentoPath(String(payload.departamento ?? ""), pathname)) {
        return NextResponse.redirect(new URL(departamentoHome(String(payload.departamento ?? "")), request.url));
      }
    }
    return NextResponse.next();
  } catch {
    return clearInvalidSession(NextResponse.redirect(new URL("/login", request.url)));
  }
}

export const config = {
  matcher: ["/((?!api/health|api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
