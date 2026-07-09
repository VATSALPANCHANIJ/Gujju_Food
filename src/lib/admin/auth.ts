// Owner-panel authentication — SERVER + EDGE safe (uses Web Crypto, not node:crypto,
// so it also works inside middleware). Credentials come from env vars only.

const COOKIE_NAME = "gfh_owner";
const SESSION_MINUTES = 30;

export const OWNER_COOKIE = COOKIE_NAME;
export const OWNER_SESSION_MS = SESSION_MINUTES * 60 * 1000;

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function secret(): string {
  // Prefer a dedicated secret; fall back to the password so it works with a
  // minimal setup. If neither is set, no session can ever validate (secure).
  return (process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "").trim();
}

const enc = (s: string): BufferSource => new TextEncoder().encode(s) as BufferSource;

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** Create a signed session token valid for 30 minutes. */
export async function createSessionToken(): Promise<string> {
  const payload = { exp: Date.now() + OWNER_SESSION_MS };
  const payloadStr = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await hmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, enc(payloadStr));
  return `${payloadStr}.${b64urlEncode(new Uint8Array(sig))}`;
}

/** Verify a session token: signature valid AND not expired. */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token || !secret()) return false;
  const [payloadStr, sigStr] = token.split(".");
  if (!payloadStr || !sigStr) return false;
  try {
    const key = await hmacKey();
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlDecode(sigStr) as BufferSource,
      enc(payloadStr)
    );
    if (!ok) return false;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadStr))) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

// Constant-time-ish string compare.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verify owner credentials against env vars. Optional 6-digit PIN if ADMIN_PIN
 * is set. Returns a single boolean — callers must NEVER reveal which field failed.
 */
export function verifyCredentials(username: string, password: string, pin?: string): boolean {
  const U = (process.env.ADMIN_USERNAME || "").trim();
  const P = (process.env.ADMIN_PASSWORD || "").trim();
  const PIN = (process.env.ADMIN_PIN || "").trim();
  if (!U || !P) return false; // not configured → deny
  let ok = safeEqual(username.trim(), U) && safeEqual(password, P);
  if (PIN) ok = ok && safeEqual((pin || "").trim(), PIN);
  return ok;
}

export function isOwnerAuthConfigured(): boolean {
  return Boolean((process.env.ADMIN_USERNAME || "").trim() && (process.env.ADMIN_PASSWORD || "").trim());
}
