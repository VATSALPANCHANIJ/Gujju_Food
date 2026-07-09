// POST /api/owner/login — verify owner credentials, set the HttpOnly session
// cookie. Rate-limited. Never reveals whether username or password was wrong.

import { NextResponse } from "next/server";
import { verifyCredentials, createSessionToken, OWNER_COOKIE, OWNER_SESSION_MS } from "@/lib/admin/auth";
import { isLockedOut, recordFailure, recordSuccess, recordLogin } from "@/lib/admin/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";

  const lock = isLockedOut(ip);
  if (lock.locked) {
    return NextResponse.json(
      { success: false, message: `Too many attempts. Try again in ${Math.ceil(lock.retryInSec / 60)} minutes.` },
      { status: 429 }
    );
  }

  let body: { username?: string; password?: string; pin?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    recordFailure(ip);
    return NextResponse.json({ success: false, message: "Invalid credentials." }, { status: 401 });
  }

  const ok = verifyCredentials(String(body.username || ""), String(body.password || ""), String(body.pin || ""));
  recordLogin({ at: new Date().toISOString(), ip, userAgent: ua, ok });

  if (!ok) {
    recordFailure(ip);
    // Identical response for any failure — never reveal which field was wrong.
    return NextResponse.json({ success: false, message: "Invalid credentials." }, { status: 401 });
  }

  recordSuccess(ip);
  const token = await createSessionToken();
  const res = NextResponse.json({ success: true, redirect: "/owner/dashboard" }, { status: 200 });
  res.cookies.set(OWNER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(OWNER_SESSION_MS / 1000),
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
