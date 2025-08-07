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
import { Button } from '@/components/ui/button'
import { ArrowLeft, BookCheck } from 'lucide-react'
import Link from 'next/link'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

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
      score: number
      feedback: string
    }
  }[]
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

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


  return (
    <div className="min-h-screen bg-secondary">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between border-b px-4">
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <BookCheck className="text-primary" />
            <span>Histórico de Entrevistas</span>
          </h1>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Entrevista
            </Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto max-w-5xl p-4">
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
                        {interview.professional_area.split(',').map(area => (
                            <Badge key={area.trim()} variant="secondary">{area.trim()}</Badge>
                        ))}
                    </div>
                  </div>
                   <div className="text-right">
                       <p className="text-sm text-muted-foreground">Pontuação Média</p>
                       <p className={`text-4xl font-bold ${getScoreColorText(interview.average_score)}`}>{interview.average_score}%</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                  <Accordion type="single" collapsible className="w-full">
                     <AccordionItem value="overall">
                        <AccordionTrigger className="text-lg font-semibold">Feedback Geral</AccordionTrigger>
                        <AccordionContent className="pt-2 text-base text-muted-foreground">
                            {interview.overall_feedback}
                        </AccordionContent>
                     </AccordionItem>
                     <AccordionItem value="details">
                        <AccordionTrigger className="text-lg font-semibold">Detalhes por Questão</AccordionTrigger>
                        <AccordionContent className="pt-2">
                             <Accordion type="multiple" className="w-full space-y-2">
                               {interview.results.map((result, index) => (
                                   <AccordionItem value={`q-${index}`} key={index} className="rounded-md border bg-secondary/50 px-4">
                                       <AccordionTrigger>
                                        <div className="flex w-full items-center justify-between pr-4">
                                            <span className="flex-1 text-left font-medium">Q{index+1}: {result.question}</span>
                                            <Badge className={getScoreColor(result.evaluation.score)}>{result.evaluation.score}%</Badge>
                                        </div>
                                       </AccordionTrigger>
                                       <AccordionContent className="space-y-4 pt-2">
                                            <div>
                                                <h4 className="font-semibold text-foreground">Sua resposta:</h4>
                                                <blockquote className="mt-1 border-l-2 pl-4 italic text-muted-foreground">"{result.answer}"</blockquote>
                                            </div>
                                             <div>
                                                <h4 className="font-semibold text-foreground">Feedback da IA:</h4>
                                                <p className="mt-1 text-muted-foreground">{result.evaluation.feedback}</p>
                                            </div>
                                       </AccordionContent>
                                   </AccordionItem>
                               ))}
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
