// Booking reference + secure manage-token generation.
// Works in both browser and server runtimes (uses Web Crypto when available).

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I

function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.getRandomValues === "function") {
    c.getRandomValues(out);
  } else {
    // Last-resort fallback (non-crypto). Server always has Web Crypto.
    for (let i = 0; i < n; i++) out[i] = Math.floor(Math.random() * 256);
  }
  return out;
}

/** Human-friendly reference, e.g. "GFH-7K2Q9X". */
export function generateBookingReference(): string {
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < bytes.length; i++) {
    code += REF_ALPHABET[bytes[i] % REF_ALPHABET.length];
  }
  return `GFH-${code}`;
}

/** Opaque, unguessable token for the no-login manage link. */
export function generateManageToken(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === "function") {
    return (c.randomUUID() + c.randomUUID()).replace(/-/g, "");
  }
  const bytes = randomBytes(32);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Absolute URL the customer uses to manage their booking (no login). */
export function manageUrl(baseUrl: string, token: string): string {
  const trimmed = baseUrl.replace(/\/$/, "");
  return `${trimmed}/manage?token=${token}`;
}
