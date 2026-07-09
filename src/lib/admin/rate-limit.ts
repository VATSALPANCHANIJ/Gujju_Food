// In-memory failed-login rate limiting + lightweight login history.
// Per warm serverless instance (fine for a single-owner panel). Swap the Map
// for Vercel KV / Upstash if you scale to multiple instances.

const MAX_FAILS = 5;
const LOCK_MS = 5 * 60 * 1000; // 5 minutes

type Attempt = { fails: number; first: number; lockedUntil: number };
const attempts = new Map<string, Attempt>();

export function isLockedOut(ip: string): { locked: boolean; retryInSec: number } {
  const rec = attempts.get(ip);
  if (rec && rec.lockedUntil > Date.now()) {
    return { locked: true, retryInSec: Math.ceil((rec.lockedUntil - Date.now()) / 1000) };
  }
  return { locked: false, retryInSec: 0 };
}

export function recordFailure(ip: string): void {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.first > LOCK_MS) {
    attempts.set(ip, { fails: 1, first: now, lockedUntil: 0 });
    return;
  }
  rec.fails += 1;
  if (rec.fails >= MAX_FAILS) rec.lockedUntil = now + LOCK_MS;
}

export function recordSuccess(ip: string): void {
  attempts.delete(ip);
}

// Login history (in-memory ring buffer). For production persistence, write these
// to a Supabase `owner_logins` table — see lib/admin/queries.ts for the shape.
export interface LoginEvent {
  at: string;
  ip: string;
  userAgent: string;
  ok: boolean;
}
const history: LoginEvent[] = [];
export function recordLogin(ev: LoginEvent): void {
  history.unshift(ev);
  if (history.length > 100) history.pop();
  console.log(`[owner-login] ${ev.ok ? "SUCCESS" : "FAILED"} ip=${ev.ip} ua="${ev.userAgent}"`);
}
export function getLoginHistory(): LoginEvent[] {
  return history.slice(0, 50);
}
