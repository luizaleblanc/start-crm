import { ApiError } from "@/shared/infrastructure/http/api-error";
import { isRealApi } from "../config/api-mode";
import { verifyMockToken } from "./token";

export function extractBearerToken(request: Request): string | undefined {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice("Bearer ".length);
}

/**
 * Em modo mock (ou na Vercel sem backend remoto), valida a assinatura HMAC do token.
 * Em API real, exige que um Bearer token esteja presente.
 */
export function requireAuth(request: Request): void {
  const token = extractBearerToken(request);
  if (!token) {
    throw new ApiError(401, "Não autenticado");
  }

  if (!isRealApi()) {
    try {
      verifyMockToken(token);
    } catch {
      throw new ApiError(401, "Token inválido ou expirado");
    }
  }
}
