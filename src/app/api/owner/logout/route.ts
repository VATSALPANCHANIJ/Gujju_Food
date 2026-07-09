// POST /api/owner/logout — clear the session cookie.
import { NextResponse } from "next/server";
import { OWNER_COOKIE } from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(OWNER_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  res.headers.set("Cache-Control", "no-store, must-revalidate");
  return res;
}
