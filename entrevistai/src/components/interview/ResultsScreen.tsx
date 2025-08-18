import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { RotateCw, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

import type { InterviewResult } from "@/types/interview"; // Corrigido aqui!

interface ResultsScreenProps {
  results: InterviewResult[];
  onRestart: () => void;
  overallFeedback: string | null;
}

export const ResultsScreen = ({ results, onRestart, overallFeedback }: ResultsScreenProps) => {
  const averageScore = useMemo(() => {
    if (results.length === 0) return 0;
    const total = results.reduce((sum, r) => sum + r.evaluation.score, 0);
    return Math.round(total / results.length);
  }, [results]);

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
          {results.map((result, index) => (
            <AccordionItem value={`item-${index}`} key={index}>
              <AccordionTrigger className="text-left hover:no-underline">
                <div className="flex justify-between items-center w-full pr-4">
                  <span className="flex-1 font-semibold">
                    Q{index + 1}: {result.question}
                  </span>
                  <span
                    className={`font-bold text-lg ${getScoreColor(
                      result.evaluation.score
                    )}`}
                  >
                    {result.evaluation.score}%
                  </span>
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
          ))}
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
