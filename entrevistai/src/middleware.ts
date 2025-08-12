// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // console.log removido para produção

  const { supabase, response } = createClient(request);

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  // console.log removido para produção

  if (!session && request.nextUrl.pathname === "/") {
    // console.log removido para produção
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // console.log removido para produção
  return response;
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
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|auth|login|signup).*)",
    "/",
  ],
};
