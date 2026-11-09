/**
 * Determina se a aplicação deve se comunicar com um back-end real (NestJS)
 * ou operar com as fixtures e repositórios em memória (mock).
 *
 * Regra de segurança para a Vercel:
 * Se a aplicação estiver rodando na nuvem da Vercel (process.env.VERCEL) e
 * NEST_API_URL estiver vazia ou apontando para localhost/127.0.0.1,
 * forçamos automaticamente o modo mock para impedir erros 500/502.
 */
export function isRealApi(): boolean {
  if (process.env.API_MODE !== "real") {
    return false;
  }

  const nestUrl = process.env.NEST_API_URL;
  if (!nestUrl || nestUrl.trim() === "") {
    return false;
  }

  const isLocalHost =
    nestUrl.includes("localhost") ||
    nestUrl.includes("127.0.0.1") ||
    nestUrl.startsWith("http://:") ||
    nestUrl.startsWith("https://localhost");

  // Se estiver na Vercel ou em produção remota com URL apontando para máquina local
  if (process.env.VERCEL || (process.env.NODE_ENV === "production" && isLocalHost)) {
    return false;
  }

  return true;
}
