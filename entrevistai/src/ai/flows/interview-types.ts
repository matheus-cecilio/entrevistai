// src/ai/flows/interview-types.ts
import { z } from "zod";

// Para iniciar a entrevista
export const StartInterviewInputSchema = z.object({
  jobRole: z.string(),
  techStack: z.string(),
});
export type StartInterviewInput = z.infer<typeof StartInterviewInputSchema>;

// Para continuar a conversa
export const ContinueInterviewInputSchema = z.object({
  jobRole: z.string(),
  techStack: z.string(),
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
  score: z.number().nullable(),
  isFinalQuestion: z.boolean(),
});
export type InterviewOutput = z.infer<typeof InterviewOutputSchema>;

// Saída da IA para a finalização
export const FinalOutputSchema = z.object({
  lastEvaluation: z.object({
    feedback: z.string(),
    score: z.number(),
  }),
  overallFeedback: z.string(),
});
export type FinalOutput = z.infer<typeof FinalOutputSchema>;
