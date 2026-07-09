// Server-only guard for owner API routes (reads the HttpOnly cookie).
import { cookies } from "next/headers";
import { OWNER_COOKIE, verifySessionToken } from "./auth";

export async function isOwnerRequest(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(OWNER_COOKIE)?.value);
}
