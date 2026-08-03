import { ApiError } from "@/shared/infrastructure/http/api-error";
import { verifyMockToken } from "./token";

export function requireAuth(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "Não autenticado");
  }
  try {
    return verifyMockToken(header.slice("Bearer ".length));
  } catch {
    throw new ApiError(401, "Token inválido ou expirado");
  }
}
