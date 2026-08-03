import { ApiError } from "@/shared/infrastructure/http/api-error";
import { verifyMockToken } from "./token";

export function extractBearerToken(request: Request): string | undefined {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice("Bearer ".length);
}

/**
 * Em API_MODE=mock, valida a assinatura HMAC do token emitido por
 * /api/auth/login. Em API_MODE=real, apenas exige que um Bearer token
 * esteja presente — a validade de fato é responsabilidade do back-end
 * real: o Repository correspondente encaminha esse token, e um 401
 * retornado por ele propaga como erro desta rota.
 */
export function requireAuth(request: Request): void {
  const token = extractBearerToken(request);
  if (!token) {
    throw new ApiError(401, "Não autenticado");
  }

  if (process.env.API_MODE !== "real") {
    try {
      verifyMockToken(token);
    } catch {
      throw new ApiError(401, "Token inválido ou expirado");
    }
  }
}
