"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { requestPasswordReset } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Enviando..." : "Enviar Link de Recuperação"}
    </Button>
  );
}

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (formData: FormData) => {
    const emailValue = formData.get("email") as string;
    setEmail(emailValue);
    
    const result = await requestPasswordReset(formData);
    
    if (result.success) {
      setSubmitted(true);
      setMessage({
        type: "success",
        text: "Link de recuperação enviado! Verifique seu email."
      });
    } else {
      setMessage({
        type: "error",
        text: result.error || "Erro ao enviar email de recuperação."
      });
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Email Enviado!</CardTitle>
            <CardDescription>
              Enviamos um link de recuperação para <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Verifique sua caixa de entrada e spam</p>
              <p>• O link expira em 1 hora</p>
              <p>• Você pode solicitar um novo link se necessário</p>
            </div>
            
            <div className="space-y-2">
              <Button
                onClick={() => {
                  setSubmitted(false);
                  setMessage(null);
                }}
                variant="outline"
                className="w-full"
              >
                Enviar Novamente
              </Button>
              
              <Button asChild variant="ghost" className="w-full">
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao Login
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Recuperar Senha</CardTitle>
          <CardDescription>
            Digite seu email para receber um link de recuperação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                defaultValue={email}
              />
            </div>

            {message && (
              <div className={`p-3 rounded-md text-sm ${
                message.type === "success" 
                  ? "bg-green-50 text-green-700 border border-green-200" 
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                <div className="flex items-center">
                  {message.type === "success" ? (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  ) : (
                    <AlertCircle className="mr-2 h-4 w-4" />
                  )}
                  {message.text}
                </div>
              </div>
            )}

            <SubmitButton />
          </form>

          <div className="mt-6 text-center">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
