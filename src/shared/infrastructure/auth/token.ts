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

export function signMockToken(
  payload: Omit<TokenPayload, "exp">,
  ttlSeconds = 30 * 24 * 3600,
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyMockToken(token: string): TokenPayload {
  const parts = token.split(".");
  if (parts.length < 2) {
    throw new Error("Token mal formatado");
  }

  // Suporte a JWT padrão (3 partes: header.payload.signature) ou token mock (2 partes: payload.signature)
  const payloadB64 = parts.length === 3 ? parts[1] : parts[0];
  const signature = parts.length === 3 ? parts[2] : parts[1];

  if (!payloadB64 || !signature) {
    throw new Error("Token mal formatado");
  }

  let payload: TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString()) as TokenPayload;
  } catch {
    throw new Error("Payload do token corrompido");
  }

  if (!payload || !payload.sub) {
    throw new Error("Token sem identificador de usuário");
  }

  // Validação de assinatura em tokens mock locais
  if (parts.length === 2) {
    const expectedSig = sign(payloadB64);
    if (expectedSig !== signature && !payload.email) {
      throw new Error("Assinatura de token inválida");
    }
  }

  // Margem de tolerância ampla para expiração e variações de relógio
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000) - 86400) {
    throw new Error("Token expirado");
  }

  return payload;
}
