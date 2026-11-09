import { NextResponse } from "next/server";
import { registerAccount } from "@/modules/iam/application/register-account.use-case";
import { signMockToken } from "@/shared/infrastructure/auth/token";
import { isRealApi } from "@/shared/infrastructure/config/api-mode";
import { ApiError } from "@/shared/infrastructure/http/api-error";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";

interface RegisterBody {
  name?: string;
  organizationName?: string;
  email?: string;
  password?: string;
}

async function registerReal(body: RegisterBody) {
  const baseUrl = process.env.NEST_API_URL;
  if (!baseUrl) {
    return registerMock(body as Required<RegisterBody>);
  }

  try {
    const response = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && "message" in payload
          ? String((payload as { message: unknown }).message)
          : "Não foi possível criar a conta";
      throw new ApiError(response.status, message);
    }

    return payload;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.warn("[register] Falha de conexão com NEST_API_URL, acionando contingência:", error);
    return registerMock(body as Required<RegisterBody>);
  }
}

async function registerMock(body: Required<RegisterBody>) {
  const { user } = await registerAccount(body);
  const accessToken = signMockToken({
    sub: user.id,
    email: user.email,
    organizationId: user.organizationId,
  });
  return { accessToken, user };
}

export const POST = handleRoute(async (request) => {
  const body = (await request.json()) as RegisterBody;
  if (!body.name || !body.organizationName || !body.email || !body.password) {
    throw new ApiError(400, "Nome, empresa, e-mail e senha são obrigatórios");
  }

  const result = isRealApi()
    ? await registerReal(body)
    : await registerMock(body as Required<RegisterBody>);

  return NextResponse.json(result, { status: 201 });
});
