import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(plain, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function isStrongPassword(plain: string): boolean {
  return plain.length >= 8 && /[a-zA-Z]/.test(plain) && /[0-9]/.test(plain);
}
