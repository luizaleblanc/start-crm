import { NextResponse } from "next/server";
import { mockCredentials } from "@/modules/iam/infrastructure/auth-credentials.mock";
import { usersRepository } from "@/modules/iam/infrastructure/repositories";
import { signMockToken } from "@/shared/infrastructure/auth/token";
import { ApiError } from "@/shared/infrastructure/http/api-error";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";

async function loginReal(email: string, password: string) {
  const baseUrl = process.env.NEST_API_URL;
  if (!baseUrl) throw new Error("NEST_API_URL não configurado (necessário quando API_MODE=real)");

  const response = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : "Credenciais inválidas";
    throw new ApiError(response.status, message);
  }

  return payload;
}

async function loginMock(email: string, password: string) {
  const credentials = mockCredentials[email];
  if (!credentials || credentials.password !== password) {
    throw new ApiError(401, "Credenciais inválidas");
  }

  const user = await usersRepository.findById(credentials.userId);
  if (!user) {
    throw new ApiError(401, "Credenciais inválidas");
  }

  const accessToken = signMockToken({
    sub: user.id,
    email: user.email,
    organizationId: user.organizationId,
  });
  return { accessToken, user };
}

export const POST = handleRoute(async (request) => {
  const { email, password } = (await request.json()) as { email?: string; password?: string };
  if (!email || !password) throw new ApiError(400, "E-mail e senha são obrigatórios");

  const result =
    process.env.API_MODE === "real"
      ? await loginReal(email, password)
      : await loginMock(email, password);

  return NextResponse.json(result);
});
