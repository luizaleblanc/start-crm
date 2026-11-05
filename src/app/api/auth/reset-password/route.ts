import { NextResponse } from "next/server";
import { updateCredentialPassword } from "@/modules/iam/infrastructure/auth-credentials.mock";
import { verifyMockToken } from "@/shared/infrastructure/auth/token";
import { ApiError } from "@/shared/infrastructure/http/api-error";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";

export const POST = handleRoute(async (request) => {
  const { token, newPassword } = (await request.json()) as {
    token?: string;
    newPassword?: string;
  };

  if (!token) throw new ApiError(400, "Token é obrigatório");
  if (!newPassword || newPassword.length < 8) {
    throw new ApiError(400, "A nova senha deve ter no mínimo 8 caracteres");
  }

  const hasLowercase = /[a-z]/.test(newPassword);
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?~`]/.test(newPassword);

  if (!hasLowercase || !hasUppercase || !hasNumber || !hasSpecial) {
    throw new ApiError(
      400,
      "A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais.",
    );
  }

  // Se o NestJS estiver configurado com uma URL externa (não localhost), tenta enviar para o backend
  const nestUrl = process.env.NEST_API_URL;
  const isExternalBackend =
    process.env.API_MODE === "real" &&
    nestUrl &&
    !nestUrl.includes("localhost") &&
    !nestUrl.includes("127.0.0.1");

  if (isExternalBackend) {
    try {
      const response = await fetch(`${nestUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "message" in payload
            ? String((payload as { message: unknown }).message)
            : "Erro ao redefinir senha";
        throw new ApiError(response.status, message);
      }
      return NextResponse.json(payload);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      console.warn(
        "[reset-password] Falha ao conectar ao backend externo, usando validação direta:",
        err,
      );
    }
  }

  // Validação direta via token
  try {
    const payload = verifyMockToken(token);
    if (payload.purpose && payload.purpose !== "reset-password") {
      throw new ApiError(400, "Token inválido para esta operação.");
    }
    updateCredentialPassword(payload.email, newPassword);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(400, "Token de recuperação inválido ou expirado.");
  }

  return NextResponse.json({
    message: "Senha atualizada com sucesso! Você já pode fazer login com suas novas credenciais.",
  });
});
