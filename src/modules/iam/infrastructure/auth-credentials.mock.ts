import { hashPassword } from "@/shared/infrastructure/auth/password";

interface StoredCredential {
  userId: string;
  passwordHash: string;
}

const store = new Map<string, StoredCredential>([
  ["admin@startcrm.local", { userId: "user_admin", passwordHash: hashPassword("ChangeMe123!") }],
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
