"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./auth-context";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  // Enquanto verifica o localStorage no cliente, mantém a tela estável sem redirecionar
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-caption font-medium">Carregando painel…</span>
        </div>
      </div>
    );
  }

  // Se não houver usuário autenticado, não renderiza o conteúdo enquanto redireciona
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
