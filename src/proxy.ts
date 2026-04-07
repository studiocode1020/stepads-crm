import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const proxy = auth((request) => {
  const isAutenticado = !!request.auth;
  const ehRotaPublica = request.nextUrl.pathname.startsWith("/login");

  if (!isAutenticado && !ehRotaPublica) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("authjs.session-token");
    response.cookies.delete("__Secure-authjs.session-token");
    return response;
  }

  if (isAutenticado && ehRotaPublica) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
