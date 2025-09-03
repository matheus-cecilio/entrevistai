// src/ai/flows/interview-types.ts
import { z } from "zod";

// Para iniciar a entrevista
export const StartInterviewInputSchema = z.object({
  jobRole: z.string(),
  professionalArea: z.string(),
});
export type StartInterviewInput = z.infer<typeof StartInterviewInputSchema>;

// Para iniciar a pergunta de apresentação
export const StartPresentationInputSchema = z.object({
  jobRole: z.string(),
  professionalArea: z.string(),
});
export type StartPresentationInput = z.infer<typeof StartPresentationInputSchema>;

// Para continuar a conversa
export const ContinueInterviewInputSchema = z.object({
  jobRole: z.string(),
  professionalArea: z.string(),
  conversationHistory: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
});
export type ContinueInterviewInput = z.infer<
  typeof ContinueInterviewInputSchema
>;

// Saída da IA
export const InterviewOutputSchema = z.object({
  question: z.string(),
  feedback: z.string().nullable(),
  rating: z.enum(["Resposta Inválida", "Insuficiente", "Bom", "Excelente"]).nullable(),
});
export type InterviewOutput = z.infer<typeof InterviewOutputSchema>;

// Saída da IA para apresentação (sem feedback/rating)
export const PresentationOutputSchema = z.object({
  question: z.string(),
});
export type PresentationOutput = z.infer<typeof PresentationOutputSchema>;

// Avaliação da apresentação
export const PresentationEvaluationSchema = z.object({
  formation: z.boolean(), // Se mencionou formação acadêmica ou início de carreira
  experience: z.boolean(), // Se falou sobre experiência profissional OU tecnologias/projetos/cursos (para sem experiência)
  objective: z.boolean(), // Se mencionou objetivos profissionais ou o que busca na empresa
  overall: z.enum(["Passou bem", "Abaixo do esperado"]),
  feedback: z.string(),
});
export type PresentationEvaluation = z.infer<typeof PresentationEvaluationSchema>;

// Saída da IA para a finalização
export const FinalOutputSchema = z.object({
  lastEvaluation: z.object({
    feedback: z.string(),
    rating: z.enum(["Resposta Inválida", "Insuficiente", "Bom", "Excelente"]),
  }),
  overallFeedback: z.string(),
});
export type FinalOutput = z.infer<typeof FinalOutputSchema>;

// Saída da IA para a finalização com apresentação
export const FinalOutputWithPresentationSchema = z.object({
  lastEvaluation: z.object({
    feedback: z.string(),
    rating: z.enum(["Resposta Inválida", "Insuficiente", "Bom", "Excelente"]),
  }),
  presentationEvaluation: PresentationEvaluationSchema,
  overallFeedback: z.string(),
});
export type FinalOutputWithPresentation = z.infer<typeof FinalOutputWithPresentationSchema>;
