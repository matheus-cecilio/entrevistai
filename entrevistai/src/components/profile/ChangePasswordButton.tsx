"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Key, AlertCircle, CheckCircle } from "lucide-react";
import { requestPasswordChange } from "@/lib/profile-actions";

export function ChangePasswordButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const { toast } = useToast();

  const handlePasswordChange = async () => {
    setIsLoading(true);
    
    try {
      const result = await requestPasswordChange();
      
      if (result.success) {
        setRequestSent(true);
        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada para alterar sua senha.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao enviar email",
          description: result.error || "Não foi possível enviar o email de alteração de senha.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Ocorreu um erro ao solicitar alteração de senha.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Alterar Senha
        </CardTitle>
        <CardDescription>
          Altere sua senha por motivos de segurança
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requestSent ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-800">Email enviado com sucesso!</p>
                  <p className="text-sm text-green-700">
                    Enviamos um link seguro para seu email. Use-o para definir uma nova senha.
                  </p>
                  <div className="text-xs text-green-600 mt-2 space-y-1">
                    <p>• Verifique sua caixa de entrada e spam</p>
                    <p>• O link expira em 1 hora</p>
                    <p>• Você pode solicitar um novo link se necessário</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-800">Como funciona:</p>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>1. Clique no botão para enviar um email seguro</p>
                      <p>2. Acesse o link no seu email</p>
                      <p>3. Defina sua nova senha</p>
                      <p>4. Faça login com a nova senha</p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Por motivos de segurança, você receberá um link por email para alterar sua senha.
                Esta é uma medida adicional para proteger sua conta.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handlePasswordChange}
              disabled={isLoading}
              variant={requestSent ? "outline" : "default"}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Mail className="mr-2 h-4 w-4 animate-pulse" />
                  Enviando...
                </>
              ) : requestSent ? (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Novamente
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Link por Email
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
