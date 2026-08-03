import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { AuthProvider } from "@/shared/auth/auth-context";
import { QueryProvider } from "@/shared/query/query-provider";
import { ThemeToggle } from "@/shared/theme/theme-toggle";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Start CRM",
  description: "Start CRM — MVP de front-end",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={manrope.variable}>
      <body className="bg-background font-sans text-foreground antialiased">
        <QueryProvider>
          <AuthProvider>
            <ThemeToggle />
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
