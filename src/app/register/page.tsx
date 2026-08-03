import Link from "next/link";
import { buttonVariants } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { LogoMark } from "@/shared/ui/logo-mark";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <LogoMark size={56} className="mb-2 text-foreground" />
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>
            O cadastro de novas contas ainda não está disponível nesta versão do MVP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/login"
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            Voltar para o login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
