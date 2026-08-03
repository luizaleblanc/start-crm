interface MockCredential {
  userId: string;
  password: string;
}

export const mockCredentials: Record<string, MockCredential> = {
  "admin@startcrm.local": { userId: "user_admin", password: "ChangeMe123!" },
};
