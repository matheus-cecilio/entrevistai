// src/app/page.tsx

"use client";

import { useState, useEffect, Suspense } from "react";
import { ResultsScreen } from "@/components/interview/ResultsScreen";
import { ProfileSetup } from "@/components/interview/ProfileSetup";
import { InterviewArea } from "@/components/interview/InterviewArea";
import { ProfileFormData, EvaluationResult, InterviewResult, CoreMessage } from "@/types/interview";
import {
  LoaderCircle,
  LogOut,
  LayoutDashboard,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { type User as SupabaseUser } from "@supabase/supabase-js";
import { logout } from "./login/actions";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  startInterviewAction,
  submitAnswerAction,
  finishInterviewAction,
} from "@/lib/actions";

// --- Tipos e Esquemas agora em src/types/interview.ts ---
type AppStep = "profile" | "interview" | "results";

// --- Constantes ---
const INTERVIEW_DURATION = 15 * 60; // 15 minutos

function PageContent() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [step, setStep] = useState<AppStep>("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [jobDetails, setJobDetails] = useState<ProfileFormData | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [conversationHistory, setConversationHistory] = useState<CoreMessage[]>(
    []
  );
  const [lastEvaluation, setLastEvaluation] = useState<EvaluationResult | null>(
    null
  );
  const [interviewResults, setInterviewResults] = useState<InterviewResult[]>(
    []
  );
  const [isFinalQuestion, setIsFinalQuestion] = useState(false);
  const [overallFeedback, setOverallFeedback] = useState<string | null>(null);
  const [showGeneralFeedback, setShowGeneralFeedback] = useState(false);
  const [finalEvaluation, setFinalEvaluation] = useState<EvaluationResult | null>(null);
  const [isGettingGeneralFeedback, setIsGettingGeneralFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(INTERVIEW_DURATION);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
      setAuthLoading(false);
    };

    getUser();
  }, [supabase.auth]);

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
    const result = await startInterviewAction(data);

    if (result.success && result.data) {
      const firstQuestion = result.data.question;
      setCurrentQuestion(firstQuestion);
      setConversationHistory([{ role: "assistant", content: firstQuestion }]);
      setStep("interview");
      setTimeLeft(INTERVIEW_DURATION);
    } else {
      toast({
        variant: "destructive",
        title: "Erro ao iniciar entrevista",
        description: result.error || "Tente novamente mais tarde ou revise os dados informados.",
      });
    }
    setIsLoading(false);
  };

  const handleFinishInterview = async () => {
    if (!jobDetails || !currentAnswer.trim() || !user) return;
    setIsLoading(true);

    // Monta o histórico e resultados, mas não chama finishInterviewAction ainda
    const finalHistory: CoreMessage[] = [
      ...conversationHistory,
      { role: "user", content: currentAnswer },
    ];

    // Chama IA só para avaliar a última resposta
    const result = await submitAnswerAction({
      ...jobDetails,
      conversationHistory: finalHistory,
    });

    let evaluation: EvaluationResult = { feedback: "", score: 0 };
    let question = "";
    if (result.success && result.data) {
      evaluation = {
        feedback: result.data.feedback ?? "",
        score: result.data.score ?? 0,
      };
      question = result.data.question;
    } else {
      toast({
        variant: "destructive",
        title: "Erro ao avaliar resposta final",
        description: result.error || "Não foi possível avaliar sua resposta. Tente novamente.",
      });
    }

    const finalResultsWithLastAnswer: InterviewResult[] = [
      ...interviewResults,
      {
        question: currentQuestion,
        answer: currentAnswer,
        evaluation,
      },
    ];
    setInterviewResults(finalResultsWithLastAnswer);
    setFinalEvaluation(evaluation);
    setStep("results");
    setIsLoading(false);
  };

  // Chama finishInterviewAction só quando o usuário clicar para ver o feedback geral
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
        evaluation: finalEvaluation || { feedback: "", score: 0 },
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

  // (mantido apenas o novo fluxo, função removida)

  // Função para continuar a entrevista (próxima pergunta)
  const handleContinueInterview = async () => {
    if (!jobDetails || !currentAnswer.trim()) return;
    setIsLoading(true);

    // Monta o histórico de conversa atualizado
    const updatedHistory: CoreMessage[] = [
      ...conversationHistory,
      { role: "user", content: currentAnswer },
    ];

    // Chama a ação para submeter a resposta e obter avaliação e próxima pergunta
    const result = await submitAnswerAction({
      ...jobDetails,
      conversationHistory: updatedHistory,
    });

    if (result.success && result.data) {
      // Salva resultado da questão atual
      setInterviewResults((prev) => [
        ...prev,
        {
          question: currentQuestion,
          answer: currentAnswer,
          evaluation: {
            feedback: result.data.feedback ?? "",
            score: result.data.score ?? 0,
          },
        },
      ]);
      setLastEvaluation({
        feedback: result.data.feedback ?? "",
        score: result.data.score ?? 0,
      });
      setConversationHistory(updatedHistory);

      // Se não houver próxima pergunta, marca como última
      if (!result.data.question || interviewResults.length >= 3) {
        setIsFinalQuestion(true);
      } else {
        setCurrentQuestion(result.data.question);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Erro ao enviar resposta",
        description: result.error || "Tente novamente.",
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
    setTimeLeft(INTERVIEW_DURATION);
  };

  const renderContent = () => {
    switch (step) {
      case "profile":
        return (
          <ProfileSetup onStart={handleStartInterview} isLoading={isLoading} />
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
        // Mostra feedback da quinta questão e botão para ver feedback geral
        if (!showGeneralFeedback && finalEvaluation) {
          return (
            <Card className="border-primary bg-primary/5 max-w-xl mx-auto mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <span>Feedback da 5ª Questão</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">Score</span>
                    <span className="font-bold text-primary">
                      {finalEvaluation.score} / 100
                    </span>
                  </div>
                  <Progress value={finalEvaluation.score} className="h-3 [&>div]:bg-primary" />
                </div>
                <p className="text-muted-foreground">{finalEvaluation.feedback}</p>
                <Button onClick={handleShowGeneralFeedback} disabled={isGettingGeneralFeedback} className="w-full mt-4">
                  {isGettingGeneralFeedback ? <LoaderCircle className="animate-spin" /> : "Ver Feedback Geral"}
                </Button>
              </CardContent>
            </Card>
          );
        }
        // Depois de clicar, mostra tela de resultados completa
        return (
          <ResultsScreen
            results={interviewResults}
            onRestart={handleRestart}
            overallFeedback={overallFeedback}
          />
        );
      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verificando sua sessão...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl">
        {user && <Header user={user} />}
        <Card className="shadow-2xl">{renderContent()}</Card>
      </div>
    </main>
  );
}

// Componente Wrapper para Suspense
export default function AIInterviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PageContent />
    </Suspense>
  );
}

const Header = ({ user }: { user: SupabaseUser }) => {
  return (
    <header className="mb-4 flex items-center justify-between rounded-lg border bg-card p-2">
      <div className="text-sm text-muted-foreground">
        Logado como:{" "}
        <span className="font-semibold text-foreground">{user.email}</span>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Histórico
          </Button>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="w-full cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Histórico</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logout} className="w-full">
              <DropdownMenuItem asChild>
                <button className="w-full cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
