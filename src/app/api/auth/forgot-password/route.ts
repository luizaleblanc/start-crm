import { NextResponse } from "next/server";
import { usersSeed } from "@/modules/iam/infrastructure/seed";
import { signMockToken } from "@/shared/infrastructure/auth/token";
import { isRealApi } from "@/shared/infrastructure/config/api-mode";
import { ApiError } from "@/shared/infrastructure/http/api-error";
import { handleRoute } from "@/shared/infrastructure/http/handle-route";
import { sendPasswordResetEmail } from "@/shared/infrastructure/mail/mail-service";

export const POST = handleRoute(async (request) => {
  const { email } = (await request.json()) as { email?: string };
  if (!email) throw new ApiError(400, "E-mail é obrigatório");

  const normalizedEmail = email.trim().toLowerCase();

  if (isRealApi()) {
    const nestUrl = process.env.NEST_API_URL;
    try {
      const response = await fetch(`${nestUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const payload = await response.json().catch(() => null);
      if (response.ok) {
        return NextResponse.json(payload);
      }
    } catch (err) {
      console.warn(
        "[forgot-password] Falha ao conectar ao backend externo, usando envio direto:",
        err,
      );
    }
  }

  // Envio direto via Next.js (funciona na Vercel ou localmente)
  const user = usersSeed.find((u) => u.email.toLowerCase() === normalizedEmail);
  const name = user?.name || "Usuário";

  // Gera token assinado válido por 15 minutos (900 segundos)
  const token = signMockToken(
    {
      sub: user?.id || "anon",
      email: normalizedEmail,
      purpose: "reset-password",
    },
    900,
  );

  // Determina a URL base da aplicação
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const appBaseUrl =
    origin ||
    (host ? `${proto}://${host}` : null) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://start-crm-lime.vercel.app";

  const resetUrl = `${appBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;

  await sendPasswordResetEmail({
    to: normalizedEmail,
    name,
    resetUrl,
    expiresInMinutes: 15,
  });

  return NextResponse.json({
    message: "Se este e-mail estiver cadastrado, as instruções para redefinição foram enviadas.",
  });
});
