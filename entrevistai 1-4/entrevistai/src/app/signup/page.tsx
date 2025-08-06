"use client";
import { signup } from "../login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default async function SignupPage() {
  const message = useSearchParams().get("message");
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-primary">Criar Conta</h1>
          <p className="text-muted-foreground">
            Comece sua jornada no EntrevistAI.
          </p>
        </div>
        <form className="flex w-full flex-1 flex-col justify-center gap-2 text-foreground">
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

          <Button formAction={signup} variant="default" className="mt-4 w-full">
            Cadastrar-se
          </Button>

          {message && (
            <p className="mt-4 p-4 bg-foreground/10 text-foreground text-center">
              {message}
            </p>
          )}
        </form>
        <p className="mt-6 text-center text-sm">
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
          >
            Faça Login
          </Link>
        </p>
      </div>
    </div>
  );
}
