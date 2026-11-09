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

function getPasswordError(password: string): string | null {
  if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "A senha deve ter ao menos 8 caracteres, com letras e números";
  }
  return null;
}

export default function RegisterPage() {
  const { user, isLoading, register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    const passwordError = getPasswordError(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ name, organizationName, email, password });
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Não foi possível criar a conta");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center gap-2 text-center">
          <LogoMark size={64} className="mb-1 text-foreground" />
          <CardTitle>Criar conta no Start CRM</CardTitle>
          <CardDescription>Comece agora, é rápido e gratuito para testar</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input
              label="Seu nome"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <Input
              label="Nome da empresa"
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              required
            />
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <Input
              label="Confirmar senha"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
            {error && <p className="text-caption text-destructive">{error}</p>}
            <Button type="submit" isLoading={isSubmitting}>
              Criar conta
            </Button>
            <Link href="/login" className={buttonVariants({ variant: "outline" })}>
              Já tenho uma conta
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
