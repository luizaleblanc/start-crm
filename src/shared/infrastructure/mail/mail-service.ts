import fs from "fs";
import path from "path";
import nodemailer, { type Transporter } from "nodemailer";

interface SendPasswordResetEmailParams {
  to: string;
  name: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const host = process.env.GCP_SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.GCP_SMTP_PORT || "587");
  const secure = process.env.GCP_SMTP_SECURE === "true";
  const user = process.env.GCP_SMTP_USER;
  const pass = process.env.GCP_SMTP_PASSWORD;

  if (!user || !pass || pass === "sua-app-password-aqui") {
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
    return transporter;
  } catch (error) {
    console.error("[MailService] Falha ao criar transporte SMTP:", error);
    return null;
  }
}

function getFromAddress(): string {
  const fromName = process.env.MAIL_FROM_NAME || "Start CRM";
  const fromAddress =
    process.env.MAIL_FROM_ADDRESS || process.env.GCP_SMTP_USER || "nao-responda@startcrm.com.br";
  return `"${fromName}" <${fromAddress}>`;
}

export async function sendPasswordResetEmail(data: SendPasswordResetEmailParams): Promise<boolean> {
  const mailer = getTransporter();
  const from = getFromAddress();
  const minutes = data.expiresInMinutes || 15;
  const subject = "Recuperação de Senha — Start CRM";

  const logoPath = path.resolve(process.cwd(), "public/brand/logo-black-cropped.png");
  const hasLogo = fs.existsSync(logoPath);

  const attachments = hasLogo
    ? [
        {
          filename: "logo.png",
          path: logoPath,
          cid: "startcrm-logo",
        },
      ]
    : [];

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Senha</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; padding: 48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          
          <!-- Header apenas com a Logo (sem textos e sem distorção) -->
          <tr>
            <td align="center" style="padding: 36px 32px 20px;">
              ${
                hasLogo
                  ? `<img src="cid:startcrm-logo" alt="Logo" width="34" height="54" style="display: block; margin: 0 auto; border: 0; width: 34px; height: 54px; max-width: 34px; max-height: 54px;" />`
                  : ""
              }
            </td>
          </tr>

          <!-- Conteúdo Principal -->
          <tr>
            <td style="padding: 0 36px 36px;">
              <h1 style="color: #111827; font-size: 20px; font-weight: 700; margin: 0 0 12px; text-align: center;">
                Redefinição de senha
              </h1>
              <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                Olá, <strong>${data.name}</strong>. Recebemos uma solicitação para redefinir a senha da sua conta de acesso.
              </p>

              <!-- Botão Principal de Ação -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${data.resetUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 13px 32px; border-radius: 6px;">
                      Redefinir Senha
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Aviso de Expiração Neutro -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; border-radius: 6px; margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 12px 16px; font-size: 13px; color: #4b5563;">
                    Este link é válido por <strong>${minutes} minutos</strong> e pode ser utilizado apenas uma vez.
                  </td>
                </tr>
              </table>

              <!-- Link Alternativo -->
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 6px;">
                Caso o botão não funcione, utilize o link direto no seu navegador:
              </p>
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 12px; font-size: 12px; color: #4b5563; word-break: break-all; margin: 0 0 24px;">
                ${data.resetUrl}
              </div>

              <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                Se você não solicitou esta alteração, ignore este e-mail. Sua senha atual permanecerá inalterada.
              </p>
            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td align="center" style="border-top: 1px solid #f3f4f6; padding: 20px 32px; font-size: 12px; color: #9ca3af; background-color: #fafafa;">
              Start CRM &bull; Segurança e Controle de Acesso
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  if (!mailer) {
    console.warn(
      `[SIMULAÇÃO DE E-MAIL - SEM SMTP CONFIGURADO]
Para: ${data.to}
Assunto: ${subject}
Link: ${data.resetUrl}`,
    );
    return true;
  }

  try {
    const info = await mailer.sendMail({
      from,
      to: data.to,
      subject,
      html,
      attachments,
      text: `Olá ${data.name}. Para redefinir sua senha no Start CRM, utilize o link: ${data.resetUrl}`,
    });
    console.log(`[MailService] E-mail enviado para ${data.to} (ID: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`[MailService] Erro ao enviar e-mail para ${data.to}:`, error);
    return false;
  }
}
