import { NextResponse } from "next/server";
import { ApiError } from "@/shared/infrastructure/http/api-error";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";

/**
 * Mock: sempre responde com sucesso genérico, sem enviar e-mail de verdade
 * (não há infraestrutura de e-mail no projeto) e sem revelar se o endereço
 * existe na base — evita enumeração de contas.
 */
export const POST = handleRoute(async (request) => {
  const { email } = (await request.json()) as { email?: string };
  if (!email) throw new ApiError(400, "E-mail é obrigatório");

  return NextResponse.json({
    message: "Se este e-mail existir em nossa base, você receberá instruções em breve",
  });
});
