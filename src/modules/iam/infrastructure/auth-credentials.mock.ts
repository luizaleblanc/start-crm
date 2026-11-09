import { hashPassword } from "@/shared/infrastructure/auth/password";

interface StoredCredential {
  userId: string;
  passwordHash: string;
}

const defaultPasswordHash = hashPassword("ChangeMe123!");

const store = new Map<string, StoredCredential>([
  ["admin@startcrm.local", { userId: "user_admin", passwordHash: defaultPasswordHash }],
  ["luizaa.fq@gmail.com", { userId: "user_luiza", passwordHash: defaultPasswordHash }],
  ["cleiton@startcrm.local", { userId: "user_cleiton", passwordHash: defaultPasswordHash }],
  ["si@startcrm.local", { userId: "user_si", passwordHash: defaultPasswordHash }],
  ["elis@startcrm.local", { userId: "user_elis", passwordHash: defaultPasswordHash }],
  ["bruno@startcrm.local", { userId: "user_bruno", passwordHash: defaultPasswordHash }],
]);

export function findCredential(email: string): StoredCredential | undefined {
  return store.get(email.toLowerCase().trim());
}

export function credentialExists(email: string): boolean {
  return store.has(email.toLowerCase().trim());
}

export function saveCredential(email: string, credential: StoredCredential): void {
  store.set(email.toLowerCase().trim(), credential);
}

export function updateCredentialPassword(email: string, newPassword: string): boolean {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = store.get(normalizedEmail);
  if (existing) {
    store.set(normalizedEmail, { ...existing, passwordHash: hashPassword(newPassword) });
    return true;
  }
  store.set(normalizedEmail, {
    userId: `user_${Date.now()}`,
    passwordHash: hashPassword(newPassword),
  });
  return true;
}
