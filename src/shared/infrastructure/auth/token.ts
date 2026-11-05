import { createHmac } from "crypto";

export interface TokenPayload {
  sub: string;
  email: string;
  organizationId?: string;
  purpose?: string;
  exp: number;
}

function getSecret(): string {
  return process.env.AUTH_MOCK_SECRET || "start-crm-mock-secret-change-me";
}

function sign(body: string): string {
  return createHmac("sha256", getSecret()).update(body).digest("base64url");
}

export function signMockToken(payload: Omit<TokenPayload, "exp">, ttlSeconds = 3600): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyMockToken(token: string): TokenPayload {
  const [body, signature] = token.split(".");
  if (!body || !signature || sign(body) !== signature) {
    throw new Error("Token inválido");
  }
  const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as TokenPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expirado");
  }
  return payload;
}
