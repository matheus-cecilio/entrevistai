import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, CheckCircle, AlertCircle, XCircle, Star } from "lucide-react";
import type { EvaluationResult } from "@/types/interview";

const getRatingConfig = (rating: EvaluationResult["rating"]) => {
  switch (rating) {
    case "Excelente":
      return {
        icon: Star,
        color: "text-green-600",
        bgColor: "bg-green-900/20 border-green-600/30",
        textColor: "text-green-400",
        cardBg: "bg-green-950/30 border-green-600/30"
      };
    case "Bom":
      return {
        icon: CheckCircle,
        color: "text-blue-600",
        bgColor: "bg-blue-900/20 border-blue-600/30",
        textColor: "text-blue-400",
        cardBg: "bg-blue-950/30 border-blue-600/30"
      };
    case "Insuficiente":
      return {
        icon: AlertCircle,
        color: "text-orange-600",
        bgColor: "bg-orange-900/20 border-orange-600/30",
        textColor: "text-orange-400",
        cardBg: "bg-orange-950/30 border-orange-600/30"
      };
    case "Resposta Inválida":
      return {
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-900/20 border-red-600/30",
        textColor: "text-red-400",
        cardBg: "bg-red-950/30 border-red-600/30"
      };
  }
};

export const FeedbackDisplay = ({ evaluation, onNext }: { evaluation: EvaluationResult; onNext: () => void }) => {
  const config = getRatingConfig(evaluation.rating);
  const IconComponent = config.icon;

  return (
    <Card className={`${config.cardBg} border-2`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Lightbulb className="text-primary" />
          <span>Feedback</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`flex items-center gap-2 p-3 rounded-lg ${config.bgColor}`}>
          <IconComponent className={`${config.color} h-5 w-5`} />
          <span className={`font-semibold ${config.textColor}`}>
            {evaluation.rating}
          </span>
        </div>
        <p className="text-muted-foreground">{evaluation.feedback}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={onNext}>Próxima Pergunta</Button>
      </CardFooter>
    </Card>
  );
};
