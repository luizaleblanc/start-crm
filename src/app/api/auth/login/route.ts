import { NextResponse } from "next/server";
import { mockCredentials } from "@/modules/iam/infrastructure/auth-credentials.mock";
import { usersRepository } from "@/modules/iam/infrastructure/repositories";
import { signMockToken } from "@/shared/infrastructure/auth/token";
import { ApiError } from "@/shared/infrastructure/http/api-error";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";

export const POST = handleRoute(async (request) => {
  const { email, password } = (await request.json()) as { email?: string; password?: string };
  const credentials = email ? mockCredentials[email] : undefined;
  if (!credentials || credentials.password !== password) {
    throw new ApiError(401, "Credenciais inválidas");
  }

  const user = usersRepository.findById(credentials.userId);
  if (!user) {
    throw new ApiError(401, "Credenciais inválidas");
  }

  const accessToken = signMockToken({
    sub: user.id,
    email: user.email,
    organizationId: user.organizationId,
  });
  return NextResponse.json({ accessToken, user });
});
