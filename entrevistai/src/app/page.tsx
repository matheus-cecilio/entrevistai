// src/app/page.tsx

"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Briefcase,
  Layers,
  Sparkles,
  Timer,
  LoaderCircle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  RotateCw,
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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  startInterviewAction,
  submitAnswerAction,
  finishInterviewAction,
} from "@/lib/actions";

// --- Tipos e Esquemas ---
// Padronização: nomes em português
type MensagemConversa = {
  role: "user" | "assistant";
  content: string;
};

const esquemaPerfil = z.object({
  jobRole: z.string().min(3, "Função profissional obrigatória"),
  techStack: z.string().min(2, "Stack técnica obrigatória"),
});
type ProfileFormData = z.infer<typeof profileSchema>;

type EvaluationResult = {
  feedback: string;
  score: number;
};

export type InterviewResult = {
  question: string;
  answer: string;
  evaluation: EvaluationResult;
};

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

  const handleContinueInterview = async () => {
    if (!jobDetails || !currentAnswer.trim()) return;
    setIsLoading(true);
    setLastEvaluation(null);

    const newHistory: CoreMessage[] = [
      ...conversationHistory,
      { role: "user", content: currentAnswer },
    ];

    const result = await submitAnswerAction({
      ...jobDetails,
      conversationHistory: newHistory,
    });

    if (result.success && result.data) {
      const { feedback, score, question } = result.data;
      const evaluation = { feedback: feedback ?? "", score: score ?? 0 };

      // Atualizamos o estado dos resultados primeiro
      const updatedResults = [
        ...interviewResults,
        { question: currentQuestion, answer: currentAnswer, evaluation },
      ];
      setInterviewResults(updatedResults);
      setLastEvaluation(evaluation);

      setConversationHistory([
        ...newHistory,
        { role: "assistant", content: question },
      ]);

      setCurrentQuestion(question);

      // --- MUDANÇA PRINCIPAL AQUI ---
      // Agora, nós decidimos se a próxima pergunta é a final.
      // Se já temos 4 resultados, a próxima (a 5ª) é a última.
      setIsFinalQuestion(updatedResults.length === 4);
    } else {
      toast({
        variant: "destructive",
        title: "Erro ao avaliar resposta",
        description: result.error || "Não foi possível avaliar sua resposta. Tente novamente.",
      });
    }
    setIsLoading(false);
  };

  const handleFinishInterview = async () => {
    if (!jobDetails || !currentAnswer.trim() || !user) return;
    setIsLoading(true);

    const finalHistory: CoreMessage[] = [
      ...conversationHistory,
      { role: "user", content: currentAnswer },
    ];

    const finalResultsWithLastAnswer: InterviewResult[] = [
      ...interviewResults,
      {
        question: currentQuestion,
        answer: currentAnswer,
        evaluation: { feedback: "", score: 0 },
      },
    ];

    const result = await finishInterviewAction({
      ...jobDetails,
      conversationHistory: finalHistory,
      finalResults: finalResultsWithLastAnswer,
      userId: user.id,
    });

    if (result.success && result.data) {
      const {
        lastEvaluation: finalEvaluation,
        overallFeedback: finalOverallFeedback,
      } = result.data;
      const finalResultsForDisplay = [...finalResultsWithLastAnswer];
      finalResultsForDisplay[finalResultsForDisplay.length - 1].evaluation =
        finalEvaluation;
      setInterviewResults(finalResultsForDisplay);
      setOverallFeedback(finalOverallFeedback);
      setStep("results");
    } else {
      toast({
        variant: "destructive",
        title: "Erro ao finalizar entrevista",
        description: result.error || "Não foi possível finalizar a entrevista. Tente novamente.",
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

const ProfileSetup = ({
  onStart,
  isLoading,
}: {
  onStart: (data: ProfileFormData) => void;
  isLoading: boolean;
}) => {
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { jobRole: "", techStack: "" },
  });

  return (
    <>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-8 w-8" />
        </div>
        <CardTitle className="text-3xl font-bold">EntrevistAI</CardTitle>
        <CardDescription className="text-lg">
          Aprimore suas habilidades com uma entrevista conversacional baseada em
          IA.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onStart)} className="space-y-6">
            <FormField
              control={form.control}
              name="jobRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Sua função profissional
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Exemplo: Desenvolvedor React Senior"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="techStack"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Stack Técnica</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Exemplo: React, Node.js, TypeScript, JS"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full text-lg"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                "Começar Entrevista"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </>
  );
};

const InterviewArea = ({
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
}: {
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
}) => {
  const formatTime = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
      seconds % 60
    ).padStart(2, "0")}`;

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
                <Button
                  onClick={onSubmit}
                  disabled={isLoading || !currentAnswer.trim()}
                >
                  {isLoading ? (
                    <LoaderCircle className="animate-spin" />
                  ) : isFinalQuestion ? (
                    "Enviar e Terminar"
                  ) : (
                    "Enviar Resposta"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </>
  );
};

const FeedbackDisplay = ({
  evaluation,
  onNext,
}: {
  evaluation: EvaluationResult;
  onNext: () => void;
}) => {
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
          <Progress
            value={evaluation.score}
            className="h-3 [&>div]:bg-primary"
          />
        </div>
        <p className="text-muted-foreground">{evaluation.feedback}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={onNext}>Próxima Pergunta</Button>
      </CardFooter>
    </Card>
  );
};

const ResultsScreen = ({
  results,
  onRestart,
  overallFeedback,
}: {
  results: InterviewResult[];
  onRestart: () => void;
  overallFeedback: string | null;
}) => {
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
                  <p className="italic">"{result.answer}"</p>
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
