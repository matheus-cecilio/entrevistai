import { z } from "zod";

export const esquemaPerfil = z.object({
  jobRole: z.string().min(3, "Função profissional obrigatória"),
  professionalArea: z.string().min(2, "Área de atuação obrigatória"),
});
export type ProfileFormData = z.infer<typeof esquemaPerfil>;

export type EvaluationResult = {
  feedback: string;
  rating: "Resposta Inválida" | "Insuficiente" | "Bom" | "Excelente";
};

export type PresentationEvaluation = {
  formation: boolean; // Se mencionou formação acadêmica ou início de carreira
  experience: boolean; // Se falou sobre experiência profissional OU tecnologias/projetos/cursos (para sem experiência)
  objective: boolean; // Se mencionou objetivos profissionais ou o que busca na empresa
  overall: "Passou bem" | "Abaixo do esperado";
  feedback: string;
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
