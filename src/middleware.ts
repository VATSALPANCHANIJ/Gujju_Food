// Protects every /owner/* route. Runs on the Edge runtime — auth.ts uses Web
// Crypto so it works here. Unauthenticated requests are redirected to the login
// page. Also sets no-store so the back button can't reveal cached owner pages
// after logout.

import { NextResponse, type NextRequest } from "next/server";
import { OWNER_COOKIE, verifySessionToken } from "@/lib/admin/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The login page itself is public.
  if (pathname === "/owner/login") return NextResponse.next();

  const token = req.cookies.get(OWNER_COOKIE)?.value;
  const valid = await verifySessionToken(token);

  if (!valid) {
    const url = req.nextUrl.clone();
    url.pathname = "/owner/login";
    url.searchParams.set("expired", "1");
    const res = NextResponse.redirect(url);
    res.headers.set("Cache-Control", "no-store, must-revalidate");
    return res;
  }

  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store, must-revalidate");
  return res;
}

export const config = {
  matcher: ["/owner/:path*"],
};
