import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { RotateCw, CheckCircle2, XCircle, Sparkles, CheckCircle, AlertCircle, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import type { InterviewResult } from "@/types/interview";

interface ResultsScreenProps {
  results: InterviewResult[];
  onRestart: () => void;
  overallFeedback: string | null;
}

export const ResultsScreen = ({ results, onRestart, overallFeedback }: ResultsScreenProps) => {
  // Função para converter rating em score numérico para cálculo da média
  const getRatingScore = (rating: string): number => {
    switch (rating) {
      case "Excelente": return 100;
      case "Bom": return 75;
      case "Insuficiente": return 40;
      case "Resposta Inválida": return 0;
      default: return 0;
    }
  };

  const averageScore = useMemo(() => {
    if (results.length === 0) return 0;
    const total = results.reduce((sum, r) => sum + getRatingScore(r.evaluation.rating), 0);
    return Math.round(total / results.length);
  }, [results]);

  const getRatingConfig = (rating: string) => {
    switch (rating) {
      case "Excelente":
        return {
          icon: Star,
          badgeClass: "bg-green-100 text-green-800 border-green-200",
          textClass: "text-green-500"
        };
      case "Bom":
        return {
          icon: CheckCircle,
          badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
          textClass: "text-blue-500"
        };
      case "Insuficiente":
        return {
          icon: AlertCircle,
          badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
          textClass: "text-orange-500"
        };
      case "Resposta Inválida":
        return {
          icon: XCircle,
          badgeClass: "bg-red-100 text-red-800 border-red-200",
          textClass: "text-red-500"
        };
      default:
        return {
          icon: AlertCircle,
          badgeClass: "bg-gray-100 text-gray-800 border-gray-200",
          textClass: "text-gray-500"
        };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const ResultIcon = averageScore >= 70 ? CheckCircle2 : XCircle;

  return (
    <>
      <CardHeader className="text-center">
        <div
          className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${getScoreColor(
            averageScore
          ).replace("text-", "bg-")}/10`}
        >
          <ResultIcon className={`h-8 w-8 ${getScoreColor(averageScore)}`} />
        </div>
        <CardTitle className="text-3xl font-bold">
          Entrevista Completa!
        </CardTitle>
        <CardDescription className="text-lg">
          Sua pontuação média é:{" "}
          <span className={`font-bold ${getScoreColor(averageScore)}`}>
            {averageScore}%
          </span>
        </CardDescription>
      </CardHeader>

      {overallFeedback && (
        <CardContent className="space-y-2">
          <Card className="border-primary bg-primary/5 p-4">
            <CardTitle className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="text-primary h-5 w-5" />
              Feedback Geral
            </CardTitle>
            <CardDescription className="text-base text-foreground/90">
              {overallFeedback}
            </CardDescription>
          </Card>
        </CardContent>
      )}

      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {results.map((result, index) => {
            const config = getRatingConfig(result.evaluation.rating);
            const IconComponent = config.icon;
            
            return (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex justify-between items-center w-full pr-4">
                    <span className="flex-1 font-semibold">
                      Q{index + 1}: {result.question}
                    </span>
                    <Badge className={config.badgeClass}>
                      <IconComponent className="h-3 w-3 mr-1" />
                      {result.evaluation.rating}
                    </Badge>
                  </div>
                </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div>
                  <h4 className="font-semibold text-muted-foreground">
                    Sua resposta:
                  </h4>
                  <p className="italic">&ldquo;{result.answer}&rdquo;</p>
                </div>
                <div>
                  <h4 className="font-semibold text-muted-foreground">
                    Feedback:
                  </h4>
                  <p>{result.evaluation.feedback}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
      <CardFooter className="justify-center">
        <Button onClick={onRestart} size="lg">
          <RotateCw className="mr-2 h-4 w-4" />
          Começar nova Entrevista
        </Button>
      </CardFooter>
    </>
  );
};
