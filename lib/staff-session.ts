import crypto from "crypto";

export const STAFF_COOKIE_NAME = "mz_staff_session";
const SESSION_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 أيام

function getSecret() {
  const secret = process.env.STAFF_SESSION_SECRET;
  if (!secret) throw new Error("STAFF_SESSION_SECRET is not set");
  return secret;
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createStaffSessionToken(): { value: string; maxAge: number } {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = String(expiresAt);
  const signature = sign(payload);
  return { value: `${payload}.${signature}`, maxAge: SESSION_DURATION_MS / 1000 };
}

export function verifyStaffSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload);
  if (signature.length !== expected.length) return false;
  const validSignature = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
  if (!validSignature) return false;

  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}
