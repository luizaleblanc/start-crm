import { hashPassword } from "@/shared/infrastructure/auth/password";

interface StoredCredential {
  userId: string;
  passwordHash: string;
}

const store = new Map<string, StoredCredential>([
  ["admin@startcrm.local", { userId: "user_admin", passwordHash: hashPassword("ChangeMe123!") }],
  ["luizaa.fq@gmail.com", { userId: "user_luiza", passwordHash: hashPassword("ChangeMe123!") }],
]);

export function findCredential(email: string): StoredCredential | undefined {
  return store.get(email);
}

export function credentialExists(email: string): boolean {
  return store.has(email);
}

export function saveCredential(email: string, credential: StoredCredential): void {
  store.set(email, credential);
}

export function updateCredentialPassword(email: string, newPassword: string): boolean {
  const existing = store.get(email);
  if (existing) {
    store.set(email, { ...existing, passwordHash: hashPassword(newPassword) });
    return true;
  }
  store.set(email, {
    userId: `user_${Date.now()}`,
    passwordHash: hashPassword(newPassword),
  });
  return true;
}
