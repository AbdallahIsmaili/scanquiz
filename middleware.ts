import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token"); // Get token from cookies

  const protectedRoutes = ["/login", "/register"];
  const authRequiredRoutes = ["/pages", "/dashboard"]; // Add routes that require authentication

  const isProtectedRoute = protectedRoutes.includes(req.nextUrl.pathname);
  const isAuthRequiredRoute = authRequiredRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  // Redirect authenticated users away from login/register
  if (token && isProtectedRoute) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Block unauthenticated users from accessing auth-required routes
  if (!token && isAuthRequiredRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/pages/:path*", "/dashboard/:path*"], // Add protected routes to matcher
};
