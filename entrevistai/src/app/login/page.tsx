// src/app/login/page.tsx
"use client";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useOptimizedNavigation } from "@/hooks/use-optimized-navigation";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="default" className="w-full" disabled={pending}>
      {pending ? "Entrando..." : "Entrar"}
    </Button>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const encodedMessage = searchParams?.get("message");
  const message = encodedMessage ? decodeURIComponent(encodedMessage) : null;
  const { preloadRoute } = useOptimizedNavigation();

  // Preload da página de signup
  const handlePreload = () => {
    preloadRoute('/signup');
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-primary">EntrevistAI</h1>
          <p className="text-muted-foreground">Acesse sua conta para começar</p>
        </div>

        <form action={login} className="flex w-full flex-1 flex-col justify-center gap-4 text-foreground">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              placeholder="you@example.com"
              required
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
            />
          </div>
          <SubmitButton />
          {message && (
            <div className={`mt-4 p-3 rounded-md text-center text-sm ${
              message.includes('criada') || message.includes('Verifique seu email') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}
        </form>

        <p className="mt-6 text-center text-sm">
          Não tem uma conta?{" "}
          <Link
            href="/signup"
            className="font-semibold text-primary hover:underline"
            prefetch={true}
            onMouseEnter={handlePreload}
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <p>Carregando...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
