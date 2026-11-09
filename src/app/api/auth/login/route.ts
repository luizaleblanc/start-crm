import { NextResponse } from "next/server";
import type { User } from "@/modules/iam/domain/entities";
import {
  findCredential,
  isValidMockPassword,
} from "@/modules/iam/infrastructure/auth-credentials.mock";
import { usersRepository } from "@/modules/iam/infrastructure/repositories";
import { usersSeed } from "@/modules/iam/infrastructure/seed";
import { verifyPassword } from "@/shared/infrastructure/auth/password";
import { signMockToken } from "@/shared/infrastructure/auth/token";
import { isRealApi } from "@/shared/infrastructure/config/api-mode";
import { ApiError } from "@/shared/infrastructure/http/api-error";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";

async function loginReal(email: string, password: string) {
  const baseUrl = process.env.NEST_API_URL;
  if (!baseUrl) {
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
  const normalizedEmail = email.trim().toLowerCase();
  const credentials = findCredential(normalizedEmail);
  if (!credentials) {
    throw new ApiError(401, "Credenciais inválidas");
  }

  const isPasswordValid =
    verifyPassword(password, credentials.passwordHash) ||
    isValidMockPassword(password, credentials.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Credenciais inválidas");
  }

  let foundUser: User | undefined = usersSeed.find(
    (u) => u.id === credentials.userId || u.email.toLowerCase() === normalizedEmail,
  );

  if (!foundUser) {
    try {
      foundUser = await usersRepository.findById(credentials.userId);
    } catch {
      // ignore
    }
  }

  const user: User = foundUser ?? {
    id: credentials.userId,
    organizationId: "org_1",
    name: normalizedEmail.split("@")[0] || "Usuário",
    email: normalizedEmail,
    ativo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

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

  const result = isRealApi() ? await loginReal(email, password) : await loginMock(email, password);

  return NextResponse.json(result);
});
