import { createHmac } from "crypto";

interface TokenPayload {
  sub: string;
  email: string;
  organizationId: string;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.AUTH_MOCK_SECRET;
  if (!secret) {
    throw new Error("AUTH_MOCK_SECRET não configurado");
  }
  return secret;
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
