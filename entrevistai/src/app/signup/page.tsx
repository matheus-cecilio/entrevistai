"use client";
import { signup } from "../login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useOptimizedNavigation } from "@/hooks/use-optimized-navigation";

function SignupForm() {
  const searchParams = useSearchParams();
  const encodedMessage = searchParams?.get("message");
  const message = encodedMessage ? decodeURIComponent(encodedMessage) : null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { preloadRoute } = useOptimizedNavigation();

  // Preload da página de login
  const handlePreload = () => {
    preloadRoute('/login');
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await signup(formData);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-primary">Criar Conta</h1>
          <p className="text-muted-foreground">
            Comece sua jornada no EntrevistAI.
          </p>
        </div>
        <form action={handleSubmit} className="flex w-full flex-1 flex-col justify-center gap-2 text-foreground">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              placeholder="you@example.com"
              required
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>

          <Button 
            type="submit" 
            variant="default" 
            className="mt-4 w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Criando conta..." : "Cadastrar-se"}
          </Button>

          {message && (
            <div className={`mt-4 p-4 rounded-md text-center text-sm ${
              message.includes('criada') || message.includes('Verifique seu email') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
              {message.includes('já está cadastrado') && (
                <div className="mt-3">
                  <Link
                    href="/login"
                    className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Ir para Login
                  </Link>
                </div>
              )}
            </div>
          )}
        </form>
        <p className="mt-6 text-center text-sm">
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
            prefetch={true}
            onMouseEnter={handlePreload}
          >
            Faça Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <p>Carregando...</p>
        </div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
