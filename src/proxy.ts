import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return;
    if (session?.user?.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return;
  }

  if (session?.user?.role !== "client") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
