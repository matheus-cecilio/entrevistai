// src/ai/flows/interview-types.ts
import { z } from "zod";

// Para iniciar a entrevista
export const StartInterviewInputSchema = z.object({
  jobRole: z.string(),
  professionalArea: z.string(),
});
export type StartInterviewInput = z.infer<typeof StartInterviewInputSchema>;

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

// Saída da IA para a finalização
export const FinalOutputSchema = z.object({
  lastEvaluation: z.object({
    feedback: z.string(),
    rating: z.enum(["Resposta Inválida", "Insuficiente", "Bom", "Excelente"]),
  }),
  overallFeedback: z.string(),
});
export type FinalOutput = z.infer<typeof FinalOutputSchema>;
