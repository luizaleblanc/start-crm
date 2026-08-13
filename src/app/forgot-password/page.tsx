"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { apiFetch, ApiClientError } from "@/shared/infrastructure/http/api-client";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { LogoMark } from "@/shared/ui/logo-mark";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: { email },
        auth: false,
      });
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Não foi possível enviar o pedido");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center gap-2 text-center">
          {isSubmitted ? (
            <CheckCircle2 aria-hidden size={40} className="mb-1 text-success" />
          ) : (
            <LogoMark size={56} className="mb-1 text-foreground" />
          )}
          <CardTitle>Recuperar senha</CardTitle>
          {isSubmitted ? (
            <CardDescription>
              Se este e-mail existir em nossa base, você receberá instruções em breve.
            </CardDescription>
          ) : (
            <CardDescription>
              Informe seu e-mail para receber instruções de recuperação de senha.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <Link
              href="/login"
              className={buttonVariants({ variant: "outline", className: "w-full" })}
            >
              Voltar para o login
            </Link>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <Input
                label="E-mail"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              {error && <p className="text-caption text-destructive">{error}</p>}
              <Button type="submit" isLoading={isSubmitting}>
                Enviar instruções
              </Button>
              <Link href="/login" className={buttonVariants({ variant: "outline" })}>
                Voltar para o login
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
