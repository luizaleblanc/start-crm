"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/shared/auth/auth-context";
import { ApiClientError } from "@/shared/infrastructure/http/api-client";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { LogoMark } from "@/shared/ui/logo-mark";

export default function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("admin@startcrm.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      window.location.href = "/";
    }
  }, [isLoading, user]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Não foi possível entrar");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center gap-2 text-center">
          <LogoMark size={64} className="mb-1 text-foreground" />
          <CardTitle>Bem-vindo de volta</CardTitle>
          <CardDescription>Acesse sua conta para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <div className="flex flex-col gap-1.5">
              <Input
                label="Senha"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••••••"
                required
              />
              <Link
                href="/forgot-password"
                className="self-end text-caption text-primary underline-offset-4 hover:underline"
              >
                Esqueci a senha
              </Link>
            </div>
            {error && <p className="text-caption text-destructive">{error}</p>}
            <Button type="submit" isLoading={isSubmitting}>
              Entrar na plataforma
            </Button>
            <Link href="/register" className={buttonVariants({ variant: "outline" })}>
              Criar conta
            </Link>

            <div className="border-border/40 bg-muted/40 mt-2 rounded-lg border p-2.5 text-center text-[11px] text-muted-foreground">
              Acesso Demo:{" "}
              <span className="font-semibold text-foreground">admin@startcrm.local</span>
              <br />
              Senha padrão: <span className="font-semibold text-foreground">ChangeMe123!</span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
