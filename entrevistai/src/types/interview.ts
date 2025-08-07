import { z } from "zod";

export const esquemaPerfil = z.object({
  jobRole: z.string().min(3, "Função profissional obrigatória"),
  professionalArea: z.string().min(2, "Área de atuação obrigatória"),
});
export type ProfileFormData = z.infer<typeof esquemaPerfil>;

export type EvaluationResult = {
  feedback: string;
  score: number;
};

export type InterviewResult = {
  question: string;
  answer: string;
  evaluation: EvaluationResult;
};

export type CoreMessage = {
  role: "user" | "assistant";
  content: string;
};
