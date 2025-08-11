import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Timer, LoaderCircle, Brain } from "lucide-react";
import type { EvaluationResult } from "@/types/interview";
import { FeedbackDisplay } from "./FeedbackDisplay";

interface InterviewAreaProps {
  question: string;
  questionNumber: number;
  currentAnswer: string;
  setCurrentAnswer: (val: string) => void;
  lastEvaluation: EvaluationResult | null;
  isLoading: boolean;
  timeLeft: number;
  onSubmit: () => void;
  onNext: () => void;
  isFinalQuestion: boolean;
}

export const InterviewArea = ({
  question,
  questionNumber,
  currentAnswer,
  setCurrentAnswer,
  lastEvaluation,
  isLoading,
  timeLeft,
  onSubmit,
  onNext,
  isFinalQuestion,
}: InterviewAreaProps) => {
  const formatTime = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl">Questão {questionNumber}</CardTitle>
          <div className="flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 text-destructive font-medium">
            <Timer className="h-5 w-5" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading && !lastEvaluation ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        ) : (
          <>
            <Card className="bg-secondary">
              <CardContent className="p-6">
                <p className="text-lg font-semibold">{question}</p>
              </CardContent>
            </Card>

            {lastEvaluation ? (
              <FeedbackDisplay evaluation={lastEvaluation} onNext={onNext} />
            ) : (
              <div className="space-y-4">
                <Textarea
                  placeholder="Digite sua resposta aqui..."
                  className="min-h-[150px] text-base"
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  disabled={isLoading}
                />
                
                {isLoading ? (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 text-center">
                        <Brain className="h-5 w-5 text-primary animate-pulse" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-primary">
                            IA analisando sua resposta...
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Aguarde alguns segundos enquanto processamos e preparamos o feedback
                          </p>
                        </div>
                        <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Button
                    onClick={onSubmit}
                    disabled={!currentAnswer.trim()}
                    className="w-full"
                  >
                    {isFinalQuestion ? "Enviar e Terminar" : "Enviar Resposta"}
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </>
  );
};
