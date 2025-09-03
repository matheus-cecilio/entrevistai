"use client";

import { useState, useEffect, Suspense } from "react";
import { ResultsScreen } from "@/components/interview/ResultsScreen";
import { ProfileSetup } from "@/components/interview/ProfileSetup";
import { InterviewArea } from "@/components/interview/InterviewArea";
import { LoadingState } from "@/components/ui/loading-state";
import { AILoading } from "@/components/ui/ai-loading";
import { WelcomeModal } from "@/components/profile/WelcomeModal";
import { ProfileFormData, EvaluationResult, PresentationEvaluation, InterviewResult, CoreMessage } from "@/types/interview";
import { LoaderCircle, CheckCircle, AlertCircle, XCircle, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { startPresentationAction, startInterviewAction, submitAnswerAction, finishInterviewWithPresentationAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user-profile";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type AppStep = "profile" | "presentation" | "interview" | "results" | "loading-ai";
const INTERVIEW_DURATION = 15 * 60; // 15 minutos

export default function HomeClient({ initialUser }: { initialUser: SupabaseUser | null }) {
  const { user, loading: authLoading, initialized } = useAuth(initialUser);
  const { profile, loading: profileLoading, isFirstTime, updateProfile } = useUserProfile(user);

  const [step, setStep] = useState<AppStep>("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [jobDetails, setJobDetails] = useState<ProfileFormData | null>(null);

  // Estados da apresentação
  const [presentationQuestion, setPresentationQuestion] = useState("");
  const [presentationAnswer, setPresentationAnswer] = useState("");

  // Estados da entrevista
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [conversationHistory, setConversationHistory] = useState<CoreMessage[]>([]);
  const [lastEvaluation, setLastEvaluation] = useState<EvaluationResult | null>(null);
  const [interviewResults, setInterviewResults] = useState<InterviewResult[]>([]);
  const [isFinalQuestion, setIsFinalQuestion] = useState(false);
  
  // Estados do resultado
  const [overallFeedback, setOverallFeedback] = useState<string | null>(null);
  const [presentationEvaluation, setPresentationEvaluation] = useState<PresentationEvaluation | null>(null);
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
    if ((step === "presentation" || step === "interview") && timeLeft > 0) {
      timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft <= 0 && (step === "presentation" || step === "interview")) {
      setStep("results");
    }
    return () => clearInterval(timerId);
  }, [step, timeLeft]);

  const handleStartInterview = async (data: ProfileFormData) => {
    setIsLoading(true);
    setJobDetails(data);
    setStep("loading-ai");
    try {
      const result = await startPresentationAction(data);
      if (result.success && result.data) {
        const presentationQ = result.data.question;
        setPresentationQuestion(presentationQ);
        setStep("presentation");
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

  const handleStartInterviewAfterPresentation = async () => {
    if (!jobDetails || !presentationAnswer.trim()) return;
    setIsLoading(true);
    setStep("loading-ai");
    
    try {
      const result = await startInterviewAction(jobDetails);
      if (result.success && result.data) {
        const firstQuestion = result.data.question;
        setCurrentQuestion(firstQuestion);
        setConversationHistory([{ role: "assistant", content: firstQuestion }]);
        setStep("interview");
      } else {
        setStep("presentation");
        toast({
          variant: "destructive",
          title: "Serviço Temporariamente Indisponível",
          description: result.error || "Tente novamente em alguns minutos.",
          duration: 8000,
        });
      }
    } catch (error) {
      setStep("presentation");
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
    const result = await finishInterviewWithPresentationAction({
      ...jobDetails,
      conversationHistory: finalHistory,
      finalResults: finalResultsWithLastAnswer,
      presentationAnswer,
      userId: user.id,
    });
    if (result.success && result.data) {
      setOverallFeedback(result.data.overallFeedback);
      setPresentationEvaluation(result.data.presentationEvaluation);
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
      case "presentation":
        return (
          <div className="min-h-screen bg-secondary">
            <div className="container mx-auto max-w-4xl p-4">
              {/* Timer */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Tempo restante: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                  <span>Apresentação</span>
                </div>
                <Progress value={(1 - timeLeft / INTERVIEW_DURATION) * 100} className="mt-2" />
              </div>

              {/* Pergunta de Apresentação */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      0
                    </div>
                    Apresentação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg mb-4">{presentationQuestion}</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800 font-medium mb-2">💡 Dica: Em sua resposta, procure abordar:</p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Sua formação ou como iniciou na carreira</li>
                      <li>• Experiência atual na área e tecnologias que domina</li>
                      <li>• Principais atividades, conquistas ou projetos</li>
                      <li>• Objetivo na empresa ou o que busca na área</li>
                    </ul>
                  </div>
                  <textarea
                    value={presentationAnswer}
                    onChange={(e) => setPresentationAnswer(e.target.value)}
                    placeholder="Digite sua apresentação aqui... (1-2 minutos)"
                    className="w-full h-32 p-3 border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleStartInterviewAfterPresentation}
                    disabled={!presentationAnswer.trim() || isLoading}
                    className="w-full mt-4"
                  >
                    {isLoading ? (
                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        Iniciando Entrevista...
                      </>
                    ) : (
                      "Iniciar Entrevista"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );
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
        return <ResultsScreen results={interviewResults} onRestart={handleRestart} overallFeedback={overallFeedback} presentationEvaluation={presentationEvaluation} />;
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
