"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { useFormStatus } from "react-dom";
import { resetPassword } from "./actions";
import { useToast } from "@/hooks/use-toast";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Redefinindo..." : "Redefinir Senha"}
    </Button>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Verificar se temos os tokens necessários
  const accessToken = searchParams?.get('access_token');
  const refreshToken = searchParams?.get('refresh_token');
  const type = searchParams?.get('type');

  useEffect(() => {
    // Verificar se a URL contém os parâmetros necessários para reset
    if (type !== 'recovery' || !accessToken || !refreshToken) {
      setMessage({
        type: "error",
        text: "Link de recuperação inválido ou expirado. Solicite um novo link."
      });
    }
  }, [type, accessToken, refreshToken]);

  const handleSubmit = async (formData: FormData) => {
    if (!accessToken || !refreshToken) {
      setMessage({
        type: "error",
        text: "Tokens de autenticação não encontrados. Solicite um novo link."
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const result = await resetPassword(formData, accessToken, refreshToken);
    
    if (result.success) {
      toast({
        title: "Senha redefinida!",
        description: "Sua senha foi alterada com sucesso. Faça login com a nova senha.",
      });
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        router.push('/login?message=' + encodeURIComponent('Senha alterada com sucesso! Faça login com sua nova senha.'));
      }, 2000);
    } else {
      setMessage({
        type: "error",
        text: result.error || "Erro ao redefinir senha."
      });
    }
    
    setIsLoading(false);
  };

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      isValid: minLength && hasUpper && hasLower && hasNumber
    };
  };

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordValidation = validatePassword(password);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Redefinir Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && message.type === "error" ? (
            <div className="space-y-4">
              <div className="p-3 rounded-md text-sm bg-red-50 text-red-700 border border-red-200">
                <div className="flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  {message.text}
                </div>
              </div>
              
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/forgot-password">
                    Solicitar Novo Link
                  </Link>
                </Button>
                
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao Login
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <PasswordInput
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                
                {/* Indicadores de força da senha */}
                {password && (
                  <div className="space-y-1 text-xs">
                    <div className={`flex items-center ${passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordValidation.minLength ? <CheckCircle className="mr-1 h-3 w-3" /> : <AlertCircle className="mr-1 h-3 w-3" />}
                      Pelo menos 8 caracteres
                    </div>
                    <div className={`flex items-center ${passwordValidation.hasUpper ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordValidation.hasUpper ? <CheckCircle className="mr-1 h-3 w-3" /> : <AlertCircle className="mr-1 h-3 w-3" />}
                      Pelo menos uma letra maiúscula
                    </div>
                    <div className={`flex items-center ${passwordValidation.hasLower ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordValidation.hasLower ? <CheckCircle className="mr-1 h-3 w-3" /> : <AlertCircle className="mr-1 h-3 w-3" />}
                      Pelo menos uma letra minúscula
                    </div>
                    <div className={`flex items-center ${passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordValidation.hasNumber ? <CheckCircle className="mr-1 h-3 w-3" /> : <AlertCircle className="mr-1 h-3 w-3" />}
                      Pelo menos um número
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                
                {confirmPassword && password !== confirmPassword && (
                  <div className="flex items-center text-xs text-red-600">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    As senhas não coincidem
                  </div>
                )}
              </div>

              {message && message.type === "error" && (
                <div className="p-3 rounded-md text-sm bg-red-50 text-red-700 border border-red-200">
                  <div className="flex items-center">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    {message.text}
                  </div>
                </div>
              )}

              <SubmitButton />
            </form>
          )}

          {!message || message.type !== "error" ? (
            <div className="mt-6 text-center">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao Login
                </Link>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <p>Carregando...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
