// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // Otimização: verificar apenas nas rotas protegidas
  const isProtectedRoute = request.nextUrl.pathname === "/" || 
                          request.nextUrl.pathname.startsWith("/history") ||
                          request.nextUrl.pathname.startsWith("/profile");

  if (!isProtectedRoute) {
    return response;
  }

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Middleware auth error:', error);
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (!session && request.nextUrl.pathname === "/") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (!session && (request.nextUrl.pathname.startsWith("/history") || 
                    request.nextUrl.pathname.startsWith("/profile"))) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (auth callback)
     * - login (login page)
     * - signup (signup page)
     * - public folder
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|auth|login|signup|api).*)",
    "/",
    "/history/:path*",
    "/profile/:path*",
  ],
};
