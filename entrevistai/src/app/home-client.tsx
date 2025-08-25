"use client";

import { useState, useEffect, Suspense } from "react";
import { ResultsScreen } from "@/components/interview/ResultsScreen";
import { ProfileSetup } from "@/components/interview/ProfileSetup";
import { InterviewArea } from "@/components/interview/InterviewArea";
import { LoadingState } from "@/components/ui/loading-state";
import { AILoading } from "@/components/ui/ai-loading";
import { WelcomeModal } from "@/components/profile/WelcomeModal";
import { ProfileFormData, EvaluationResult, InterviewResult, CoreMessage } from "@/types/interview";
import { LoaderCircle, CheckCircle, AlertCircle, XCircle, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { startInterviewAction, submitAnswerAction, finishInterviewAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user-profile";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type AppStep = "profile" | "interview" | "results" | "loading-ai";
const INTERVIEW_DURATION = 15 * 60; // 15 minutos

export default function HomeClient({ initialUser }: { initialUser: SupabaseUser | null }) {
  const { user, loading: authLoading, initialized } = useAuth(initialUser);
  const { profile, loading: profileLoading, isFirstTime, updateProfile } = useUserProfile(user);

  const [step, setStep] = useState<AppStep>("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [jobDetails, setJobDetails] = useState<ProfileFormData | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [conversationHistory, setConversationHistory] = useState<CoreMessage[]>([]);
  const [lastEvaluation, setLastEvaluation] = useState<EvaluationResult | null>(null);
  const [interviewResults, setInterviewResults] = useState<InterviewResult[]>([]);
  const [isFinalQuestion, setIsFinalQuestion] = useState(false);
  const [overallFeedback, setOverallFeedback] = useState<string | null>(null);
  const [showGeneralFeedback, setShowGeneralFeedback] = useState(false);
  const [finalEvaluation, setFinalEvaluation] = useState<EvaluationResult | null>(null);
  const [isGettingGeneralFeedback, setIsGettingGeneralFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(INTERVIEW_DURATION);
  const { toast } = useToast();

  // Função para configurar rating visual
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

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (step === "interview" && timeLeft > 0) {
      timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft <= 0 && step === "interview") {
      setStep("results");
    }
    return () => clearInterval(timerId);
  }, [step, timeLeft]);

  const handleStartInterview = async (data: ProfileFormData) => {
    setIsLoading(true);
    setJobDetails(data);
    setStep("loading-ai");
    try {
      const result = await startInterviewAction(data);
      if (result.success && result.data) {
        const firstQuestion = result.data.question;
        setCurrentQuestion(firstQuestion);
        setConversationHistory([{ role: "assistant", content: firstQuestion }]);
        setStep("interview");
        setTimeLeft(INTERVIEW_DURATION);
      } else {
        setStep("profile");
        toast({
          variant: "destructive",
          title: "Serviço Temporariamente Indisponível",
          description: result.error || "Tente novamente em alguns minutos.",
          duration: 8000, // Mostra por mais tempo
        });
      }
    } catch (error) {
      setStep("profile");
      toast({
        variant: "destructive",
        title: "Erro de Conexão",
        description: "Falha na comunicação com a IA. Verifique sua internet e tente novamente.",
        duration: 8000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishInterview = async () => {
    if (!jobDetails || !currentAnswer.trim() || !user) return;
    setIsLoading(true);

    const finalHistory: CoreMessage[] = [
      ...conversationHistory,
      { role: "user", content: currentAnswer },
    ];

    const result = await submitAnswerAction({
      ...jobDetails,
      conversationHistory: finalHistory,
    });

    let evaluation: EvaluationResult = { feedback: "", rating: "Insuficiente" };
    if (result.success && result.data) {
      evaluation = {
        feedback: result.data.feedback ?? "",
        rating: result.data.rating ?? "Insuficiente",
      };
    } else {
      toast({
        variant: "destructive",
        title: "Erro ao avaliar resposta final",
        description: result.error || "Não foi possível avaliar sua resposta. Tente novamente.",
      });
    }

    const finalResultsWithLastAnswer: InterviewResult[] = [
      ...interviewResults,
      { question: currentQuestion, answer: currentAnswer, evaluation },
    ];
    setInterviewResults(finalResultsWithLastAnswer);
    setFinalEvaluation(evaluation);
    setStep("results");
    setIsLoading(false);
  };

  const handleShowGeneralFeedback = async () => {
    if (!jobDetails || !user) return;
    setIsGettingGeneralFeedback(true);
    const finalHistory: CoreMessage[] = [
      ...conversationHistory,
      { role: "user", content: currentAnswer },
    ];
    const finalResultsWithLastAnswer: InterviewResult[] = [
      ...interviewResults,
      {
        question: currentQuestion,
        answer: currentAnswer,
        evaluation: finalEvaluation || { feedback: "", rating: "Insuficiente" },
      },
    ];
    const result = await finishInterviewAction({
      ...jobDetails,
      conversationHistory: finalHistory,
      finalResults: finalResultsWithLastAnswer,
      userId: user.id,
    });
    if (result.success && result.data) {
      setOverallFeedback(result.data.overallFeedback);
      setShowGeneralFeedback(true);
    } else {
      toast({
        variant: "destructive",
        title: "Erro ao obter feedback geral",
        description: result.error || "Não foi possível obter o feedback geral. Tente novamente.",
      });
    }
    setIsGettingGeneralFeedback(false);
  };

  const handleContinueInterview = async () => {
    if (!jobDetails || !currentAnswer.trim()) return;
    setIsLoading(true);

    const updatedHistory: CoreMessage[] = [
      ...conversationHistory,
      { role: "user", content: currentAnswer },
    ];

    const result = await submitAnswerAction({
      ...jobDetails,
      conversationHistory: updatedHistory,
    });

    if (result.success && result.data) {
      setInterviewResults((prev) => [
        ...prev,
        {
          question: currentQuestion,
          answer: currentAnswer,
          evaluation: {
            feedback: result.data.feedback ?? "",
            rating: result.data.rating ?? "Insuficiente",
          },
        },
      ]);
      setLastEvaluation({ feedback: result.data.feedback ?? "", rating: result.data.rating ?? "Insuficiente" });
      setConversationHistory(updatedHistory);

      if (!result.data.question || interviewResults.length >= 3) {
        setIsFinalQuestion(true);
      } else {
        setCurrentQuestion(result.data.question);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Erro na Comunicação",
        description: result.error || "Falha ao processar sua resposta. Tente novamente.",
        duration: 6000,
      });
    }
    setIsLoading(false);
  };

  const handleSubmit = () => {
    if (isFinalQuestion) {
      handleFinishInterview();
    } else {
      handleContinueInterview();
    }
  };

  const handleNextStep = () => {
    setLastEvaluation(null);
    setCurrentAnswer("");
  };

  const handleRestart = () => {
    setStep("profile");
    setJobDetails(null);
    setCurrentQuestion("");
    setCurrentAnswer("");
    setConversationHistory([]);
    setLastEvaluation(null);
    setInterviewResults([]);
    setIsFinalQuestion(false);
    setOverallFeedback(null);
    setShowGeneralFeedback(false);
    setTimeLeft(INTERVIEW_DURATION);
  };

  const handleWelcomeComplete = (name: string) => {
    if (profile) {
      updateProfile({ ...profile, full_name: name });
    }
  };

  const renderContent = () => {
    switch (step) {
      case "profile": {
        const displayName = profile?.full_name || user?.email?.split("@")[0] || undefined;
        return <ProfileSetup onStart={handleStartInterview} isLoading={isLoading} userName={displayName} />;
      }
      case "loading-ai":
        return <AILoading message="Preparando sua entrevista personalizada..." estimatedTime={8} />;
      case "interview":
        return (
          <InterviewArea
            question={currentQuestion}
            questionNumber={interviewResults.length + 1}
            currentAnswer={currentAnswer}
            setCurrentAnswer={setCurrentAnswer}
            lastEvaluation={lastEvaluation}
            isLoading={isLoading}
            timeLeft={timeLeft}
            onSubmit={handleSubmit}
            onNext={handleNextStep}
            isFinalQuestion={isFinalQuestion}
          />
        );
      case "results":
        if (!showGeneralFeedback && finalEvaluation) {
          const config = getRatingConfig(finalEvaluation.rating);
          const IconComponent = config.icon;

          return (
            <Card className={`${config.cardBg} border-2 max-w-xl mx-auto mt-8`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <span>Feedback da 5ª Questão</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`flex items-center gap-2 p-3 rounded-lg ${config.bgColor}`}>
                  <IconComponent className={`${config.color} h-5 w-5`} />
                  <span className={`font-semibold ${config.textColor}`}>
                    {finalEvaluation.rating}
                  </span>
                </div>
                <p className="text-muted-foreground">{finalEvaluation.feedback}</p>
                {isGettingGeneralFeedback && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-blue-700">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        <span className="text-sm">A IA está analisando toda sua entrevista para gerar um feedback completo...</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
                <Button onClick={handleShowGeneralFeedback} disabled={isGettingGeneralFeedback} className="w-full mt-4">
                  {isGettingGeneralFeedback ? (
                    <div className="flex items-center gap-2">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      <span>Gerando feedback geral...</span>
                    </div>
                  ) : (
                    "Ver Feedback Geral"
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        }
        return <ResultsScreen results={interviewResults} onRestart={handleRestart} overallFeedback={overallFeedback} />;
      default:
        return null;
    }
  };

  if (!initialized) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
        <LoadingState title="Iniciando EntrevistAI..." message="Carregando sua experiência de entrevista" />
      </div>
    );
  }

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
        <LoadingState title="Verificando sua sessão..." message="Aguarde enquanto carregamos suas informações" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl">
        <Card className="shadow-2xl">{renderContent()}</Card>
      </div>
      {user && isFirstTime && !profileLoading && (
        <WelcomeModal isOpen={isFirstTime} onComplete={handleWelcomeComplete} currentEmail={user.email || ""} />
      )}
    </main>
  );
}

export function HomeClientSuspense(props: { initialUser: SupabaseUser | null }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
          <LoadingState title="Carregando EntrevistAI..." message="Preparando a melhor experiência de entrevista para você" showCard={true} />
        </div>
      }
    >
      <HomeClient {...props} />
    </Suspense>
  );
}
