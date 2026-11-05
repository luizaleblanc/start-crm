import { NextResponse } from "next/server";
import { findCredential } from "@/modules/iam/infrastructure/auth-credentials.mock";
import { usersRepository } from "@/modules/iam/infrastructure/repositories";
import { verifyPassword } from "@/shared/infrastructure/auth/password";
import { signMockToken } from "@/shared/infrastructure/auth/token";
import { ApiError } from "@/shared/infrastructure/http/api-error";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";

async function loginReal(email: string, password: string) {
  const baseUrl = process.env.NEST_API_URL;
  if (!baseUrl || (baseUrl.includes("localhost") && process.env.NODE_ENV === "production")) {
    console.warn(
      "[login] NEST_API_URL aponta para localhost em produção. Usando modo mock como contingência.",
    );
    return loginMock(email, password);
  }

  try {
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
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.warn("[login] Falha de conexão com NEST_API_URL, acionando contingência:", error);
    return loginMock(email, password);
  }
}

async function loginMock(email: string, password: string) {
  const credentials = findCredential(email);
  if (!credentials || !verifyPassword(password, credentials.passwordHash)) {
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
