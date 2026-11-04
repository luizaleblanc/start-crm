"use client";

import { Check, CheckCircle2, Lock, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { apiFetch, ApiClientError } from "@/shared/infrastructure/http/api-client";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { LogoMark } from "@/shared/ui/logo-mark";
import { cn } from "@/shared/ui/cn";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Critérios de segurança obrigatórios
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?~`]/.test(newPassword);

  const criteria = [
    { label: "Mínimo de 8 caracteres", met: hasMinLength },
    { label: "Letra maiúscula (A-Z)", met: hasUppercase },
    { label: "Letra minúscula (a-z)", met: hasLowercase },
    { label: "Pelo menos um número (0-9)", met: hasNumber },
    { label: "Caractere especial (!@#$...)", met: hasSpecial },
  ];

  const passedCount = criteria.filter((c) => c.met).length;
  const allCriteriaMet = passedCount === criteria.length;

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  // Medidor de Força da Senha
  const strength = useMemo(() => {
    if (newPassword.length === 0) {
      return {
        score: 0,
        label: "Digite uma senha",
        color: "bg-muted",
        text: "text-muted-foreground",
      };
    }
    if (passedCount <= 2) {
      return { score: 1, label: "Fraca", color: "bg-destructive", text: "text-destructive" };
    }
    if (passedCount === 3) {
      return {
        score: 2,
        label: "Média",
        color: "bg-amber-500",
        text: "text-amber-500 dark:text-amber-400",
      };
    }
    if (passedCount === 4) {
      return {
        score: 3,
        label: "Boa",
        color: "bg-blue-500",
        text: "text-blue-500 dark:text-blue-400",
      };
    }
    return {
      score: 4,
      label: "Forte e Segura",
      color: "bg-emerald-500",
      text: "text-emerald-500 dark:text-emerald-400",
    };
  }, [newPassword, passedCount]);

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

    if (!allCriteriaMet) {
      setError("A senha deve atender a todos os requisitos de segurança listados abaixo.");
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
          <CheckCircle2 size={48} className="text-emerald-500" />
        </div>
        <div>
          <h2 className="text-h6 font-bold text-foreground">Senha alterada com sucesso!</h2>
          <p className="mt-1 text-caption text-muted-foreground">
            Sua nova senha foi atualizada. Você já pode fazer login na plataforma.
          </p>
        </div>
        <Link href="/login" className={buttonVariants({ variant: "primary", className: "w-full" })}>
          Fazer Login
        </Link>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <Input
          label="Nova senha"
          type="password"
          placeholder="Digite sua nova senha"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
        />

        {/* Medidor Visual de Força de Senha */}
        {newPassword.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-muted-foreground">Força da senha:</span>
              <span className={cn("font-bold tracking-tight", strength.text)}>
                {strength.label}
              </span>
            </div>
            {/* 4 Barras de progresso com transição */}
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((seg) => (
                <div
                  key={seg}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    strength.score >= seg ? strength.color : "bg-muted/70",
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Checklist Interativo de Requisitos de Segurança */}
      <div className="bg-muted/40 rounded-xl p-3.5 shadow-inner">
        <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Requisitos de segurança
        </span>
        <div className="flex flex-col gap-1.5">
          {criteria.map((item) => (
            <div
              key={item.label}
              className={cn(
                "flex items-center gap-2 text-[12px] transition-colors",
                item.met
                  ? "font-medium text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors",
                  item.met
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground/50",
                )}
              >
                {item.met ? (
                  <Check size={11} strokeWidth={3} />
                ) : (
                  <span className="h-1 w-1 rounded-full bg-current" />
                )}
              </div>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Input
          label="Confirmar nova senha"
          type="password"
          placeholder="Repita a nova senha"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
        {passwordsMatch && (
          <p className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <Check size={12} strokeWidth={3} /> As senhas coincidem
          </p>
        )}
        {passwordsMismatch && (
          <p className="flex items-center gap-1 text-[11px] font-medium text-destructive">
            <X size={12} strokeWidth={3} /> As senhas não coincidem
          </p>
        )}
      </div>

      {error && <p className="text-caption font-medium text-destructive">{error}</p>}

      <Button
        type="submit"
        isLoading={isSubmitting}
        disabled={!allCriteriaMet || !passwordsMatch}
        className="shadow-xs w-full disabled:opacity-50"
      >
        Salvar Nova Senha
      </Button>

      <Link
        href="/login"
        className={buttonVariants({ variant: "outline", className: "w-full text-caption" })}
      >
        Cancelar e voltar ao login
      </Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="border-border/40 w-full max-w-md shadow-lg">
        <CardHeader className="items-center gap-2 pb-4 text-center">
          <LogoMark size={52} className="mb-1 text-foreground" />
          <CardTitle className="text-2xl font-bold tracking-tight">Redefinir senha</CardTitle>
          <CardDescription className="text-caption">
            Crie uma nova senha segura para acessar sua conta corporativa.
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
