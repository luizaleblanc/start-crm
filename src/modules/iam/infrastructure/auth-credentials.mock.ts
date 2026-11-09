import { hashPassword } from "@/shared/infrastructure/auth/password";

interface StoredCredential {
  userId: string;
  passwordHash: string;
}

const defaultPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
const defaultPasswordHash = hashPassword(defaultPassword);
const fallbackPasswordHash = hashPassword("AdminPassword123!");
const changeMeHash = hashPassword("ChangeMe123!");

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

export function isValidMockPassword(password: string, storedHash: string): boolean {
  if (storedHash === defaultPasswordHash) {
    // Permite a senha configurada no ambiente, ChangeMe123! ou AdminPassword123!
    const envPass = process.env.SEED_ADMIN_PASSWORD;
    if (envPass && password === envPass) return true;
    if (password === "ChangeMe123!" || password === "AdminPassword123!") return true;
  }
  return false;
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
