import { NextResponse } from "next/server";
import { ApiError } from "@/shared/infrastructure/http/api-error";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";

export const POST = handleRoute(async (request) => {
  const { email } = (await request.json()) as { email?: string };
  if (!email) throw new ApiError(400, "E-mail é obrigatório");

  if (process.env.API_MODE === "real") {
    const baseUrl = process.env.NEST_API_URL || "http://localhost:3001";
    const response = await fetch(`${baseUrl}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && "message" in payload
          ? String((payload as { message: unknown }).message)
          : "Erro ao processar solicitação";
      throw new ApiError(response.status, message);
    }
    return NextResponse.json(payload);
  }

  return NextResponse.json({
    message: "Se este e-mail existir em nossa base, você receberá instruções em breve.",
  });
});
