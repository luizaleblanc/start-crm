import { NextResponse } from "next/server";
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

  if (process.env.API_MODE === "real") {
    const baseUrl = process.env.NEST_API_URL || "http://localhost:3001";
    const response = await fetch(`${baseUrl}/auth/reset-password`, {
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
  }

  return NextResponse.json({
    message: "Senha atualizada com sucesso!",
  });
});
