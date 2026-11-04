"use client";

import { CheckCircle2, KeyRound } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { FormEvent } from "react";
import { apiFetch, ApiClientError } from "@/shared/infrastructure/http/api-client";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { LogoMark } from "@/shared/ui/logo-mark";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!token) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-body text-destructive">
          Link de recuperação inválido ou incompleto. Certifique-se de acessar o link completo
          enviado para seu e-mail.
        </p>
        <Link
          href="/forgot-password"
          className={buttonVariants({ variant: "outline", className: "w-full" })}
        >
          Solicitar novo link
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas informadas não coincidem.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: { token, newPassword },
        auth: false,
      });
      setIsSubmitted(true);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível redefinir sua senha. O link pode ter expirado.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col gap-5 text-center">
        <div className="flex justify-center">
          <CheckCircle2 size={48} className="text-success" />
        </div>
        <div>
          <h2 className="text-h6 font-bold text-foreground">Senha alterada com sucesso!</h2>
          <p className="mt-1 text-caption text-muted-foreground">
            Sua nova senha foi salva. Você já pode acessar sua conta normalmente.
          </p>
        </div>
        <Link href="/login" className={buttonVariants({ variant: "primary", className: "w-full" })}>
          Fazer Login
        </Link>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <Input
        label="Nova senha"
        type="password"
        placeholder="Mínimo 6 caracteres"
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        required
      />
      <Input
        label="Confirmar nova senha"
        type="password"
        placeholder="Repita a nova senha"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        required
      />
      {error && <p className="text-caption text-destructive">{error}</p>}
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Salvar Nova Senha
      </Button>
      <Link href="/login" className={buttonVariants({ variant: "outline" })}>
        Cancelar e voltar
      </Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center gap-2 text-center">
          <LogoMark size={52} className="mb-1 text-foreground" />
          <CardTitle>Redefinir senha</CardTitle>
          <CardDescription>
            Crie uma nova senha segura para acessar sua conta no Start CRM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="py-6 text-center text-caption text-muted-foreground">
                Carregando...
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
