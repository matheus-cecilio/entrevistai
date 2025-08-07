// src/app/login/page.tsx
"use client";
import { login } from "./actions"; // Removemos o import do 'loginWithProvider'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const message = useSearchParams().get("message");

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-primary">EntrevistAI</h1>
          <p className="text-muted-foreground">Acesse sua conta para começar</p>
        </div>

        <form className="flex w-full flex-1 flex-col justify-center gap-4 text-foreground">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              placeholder="you@example.com"
              required
              defaultValue="test@test.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              required
              defaultValue="password"
            />
          </div>
          <Button formAction={login} variant="default" className="w-full">
            Entrar
          </Button>
          {message && (
            <p className="mt-4 bg-red-100 p-3 text-center text-xs text-red-700 rounded-md">
              {message}
            </p>
          )}
        </form>

        <p className="mt-6 text-center text-sm">
          Não tem uma conta?{" "}
          <Link
            href="/signup"
            className="font-semibold text-primary hover:underline"
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
