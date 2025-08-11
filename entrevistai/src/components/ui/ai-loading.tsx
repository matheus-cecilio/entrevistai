"use client";

import { useState, useEffect } from "react";
import { LoaderCircle, Brain, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface AILoadingProps {
  message?: string;
  estimatedTime?: number; // em segundos
}

const loadingMessages = [
  "Analisando seu perfil profissional...",
  "Preparando perguntas personalizadas...",
  "Ajustando dificuldade da entrevista...",
  "Configurando contexto da IA...",
  "Quase pronto! Finalizando preparação..."
];

export function AILoading({ 
  message = "Iniciando entrevista com IA...",
  estimatedTime = 8
}: AILoadingProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    // Atualizar progresso
    const progressInterval = setInterval(() => {
      setElapsedTime((prev) => {
        const newTime = prev + 0.1;
        const newProgress = Math.min((newTime / estimatedTime) * 100, 95);
        setProgress(newProgress);
        return newTime;
      });
    }, 100);

    // Trocar mensagens
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [estimatedTime]);

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Brain className="h-8 w-8 animate-pulse" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-primary" />
          {message}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {loadingMessages[currentMessageIndex]}
            </p>
          </div>
          
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Aguarde alguns segundos... Nossa IA está preparando sua entrevista personalizada
            </p>
          </div>
        </div>
        
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Dica:</strong> Enquanto aguarda, prepare-se mentalmente para a entrevista. 
            Respire fundo e lembre-se de ser autêntico em suas respostas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
