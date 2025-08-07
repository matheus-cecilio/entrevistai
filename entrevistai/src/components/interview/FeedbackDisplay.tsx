import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { EvaluationResult } from "@/types/interview";

export const FeedbackDisplay = ({ evaluation, onNext }: { evaluation: EvaluationResult; onNext: () => void }) => {
  return (
    <Card className="border-primary bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Lightbulb className="text-primary" />
          <span>Feedback</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-semibold">Score</span>
            <span className="font-bold text-primary">
              {evaluation.score} / 100
            </span>
          </div>
          <Progress value={evaluation.score} className="h-3 [&>div]:bg-primary" />
        </div>
        <p className="text-muted-foreground">{evaluation.feedback}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={onNext}>Próxima Pergunta</Button>
      </CardFooter>
    </Card>
  );
};
