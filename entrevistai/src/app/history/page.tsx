import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { CheckCircle, AlertCircle, XCircle, Star } from "lucide-react"
import { getProfile } from '@/lib/profile-actions'
import { DeleteInterviewButton } from '@/components/interview/DeleteInterviewButton'

type Interview = {
  id: string
  created_at: string
  job_role: string
  professional_area: string
  average_score: number
  overall_feedback: string
  results: {
    question: string
    answer: string
    evaluation: {
      rating: "Resposta Inválida" | "Insuficiente" | "Bom" | "Excelente"
      feedback: string
    }
  }[]
}

export default async function HistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Buscar perfil do usuário
  const profileResult = await getProfile(user.id);
  const profile = profileResult.success ? profileResult.data : null;

  const { data: interviews, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>Erro ao carregar o histórico de entrevistas: {error.message}</p>
      </div>
    )
  }

  const getRatingConfig = (rating: "Resposta Inválida" | "Insuficiente" | "Bom" | "Excelente") => {
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
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 50) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };
  
   const getScoreColorText = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  // Formata feedback geral inserindo quebras de linha em marcadores comuns
  const formatOverallFeedback = (text: string) => {
    if (!text) return text;
    let t = text;
    // Normalizações leves
    t = t.replace(/\r\n/g, '\n');
    // 1) Quebra após ponto-e-vírgula
    t = t.replace(/;\s*/g, ';\n');
    // 2) Destacar seções/orientadores comuns
    return t;
  };

  return (
    <div className="min-h-screen bg-secondary">
      <main className="container mx-auto max-w-5xl p-4 mt-4">
        {/* Histórico de entrevistas */}
        {interviews && interviews.length > 0 ? (
          <div className="grid gap-6">
            {(interviews as Interview[]).map((interview) => (
              <Card key={interview.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between gap-4 border-b bg-muted/30">
                  <div>
                    <CardTitle className="text-2xl">{interview.job_role}</CardTitle>
                    <CardDescription className="mt-1">
                      Realizada em:{' '}
                      {new Date(interview.created_at).toLocaleDateString(
                        'pt-BR',
                        {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        }
                      )}
                    </CardDescription>
                     <div className="mt-2 flex flex-wrap gap-2">
                        {(typeof interview.professional_area === 'string' && interview.professional_area.trim() !== ''
                          ? interview.professional_area.split(',')
                          : []).map(area => (
                            <Badge key={area.trim()} variant="secondary">{area.trim()}</Badge>
                        ))}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="text-right">
                       <p className="text-sm text-muted-foreground">Pontuação Média</p>
                       <p className={`text-4xl font-bold ${getScoreColorText(interview.average_score)}`}>{interview.average_score}%</p>
                    </div>
                    <DeleteInterviewButton 
                      interviewId={interview.id}
                      jobRole={interview.job_role}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <Accordion type="single" collapsible className="w-full">
                     <AccordionItem value="overall">
                        <AccordionTrigger className="text-lg font-semibold">Feedback Geral</AccordionTrigger>
            <AccordionContent className="pt-2 text-base text-muted-foreground whitespace-pre-line leading-relaxed">
              {formatOverallFeedback(interview.overall_feedback)}
                        </AccordionContent>
                     </AccordionItem>
                     <AccordionItem value="details">
                        <AccordionTrigger className="text-lg font-semibold">Detalhes por Questão</AccordionTrigger>
                        <AccordionContent className="pt-2">
                             <Accordion type="multiple" className="w-full space-y-2">
                               {interview.results.map((result, index) => {
                                 const config = getRatingConfig(result.evaluation.rating);
                                 const IconComponent = config.icon;
                                 
                                 return (
                                   <AccordionItem value={`q-${index}`} key={index} className="rounded-md border bg-secondary/50 px-4">
                                       <AccordionTrigger>
                                        <div className="flex w-full items-center justify-between pr-4">
                                            <span className="flex-1 text-left font-medium">Q{index+1}: {result.question}</span>
                                            <Badge className={config.badgeClass}>
                                              <IconComponent className="h-3 w-3 mr-1" />
                                              {result.evaluation.rating}
                                            </Badge>
                                        </div>
                                       </AccordionTrigger>
                                       <AccordionContent className="space-y-4 pt-2">
                                            <div>
                                                <h4 className="font-semibold text-foreground">Sua resposta:</h4>
                                                <blockquote className="mt-1 border-l-2 pl-4 italic text-muted-foreground">&ldquo;{result.answer}&rdquo;</blockquote>
                                            </div>
                                             <div>
                                                <h4 className="font-semibold text-foreground">Feedback da IA:</h4>
                                                <p className="mt-1 text-muted-foreground">{result.evaluation.feedback}</p>
                                            </div>
                                       </AccordionContent>
                                   </AccordionItem>
                                 );
                               })}
                           </Accordion>
                        </AccordionContent>
                     </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mt-20 text-center">
            <h2 className="text-2xl font-semibold">Nenhuma entrevista encontrada.</h2>
            <p className="mt-2 text-muted-foreground">
              Complete sua primeira entrevista para vê-la aqui.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
