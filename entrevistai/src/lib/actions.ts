// src/lib/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import {
  startInterview,
  continueInterview,
  endInterview,
} from "@/ai/flows/interview-flow";
import {
  type StartInterviewInput,
  type ContinueInterviewInput,
} from "@/ai/flows/interview-types";
import { type InterviewResult } from "@/types/interview";

/**
 * Action para iniciar a entrevista e obter a primeira pergunta.
 */
export async function startInterviewAction(input: StartInterviewInput) {
  try {
    const output = await startInterview(input);
    return { success: true, data: output };
  } catch (error) {
    console.error("Error starting interview:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred.",
    };
  }
}

/**
 * Action para enviar uma resposta, obter feedback e a próxima pergunta.
 */
export async function submitAnswerAction(input: ContinueInterviewInput) {
  try {
    const output = await continueInterview(input);
    return { success: true, data: output };
  } catch (error) {
    console.error("Error submitting answer:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred.",
    };
  }
}

// Interface para o input da action final
interface FinishInterviewActionInput {
  jobRole: string;
  professionalArea: string;
  conversationHistory: ContinueInterviewInput['conversationHistory'];
  finalResults: InterviewResult[]; // Array com os resultados completos
  userId: string;
}

export async function finishInterviewAction(input: FinishInterviewActionInput) {
  try {
    const supabase = await createClient();

    // 1. Obter o feedback final e a avaliação da última resposta da IA
    const aiResult = await endInterview({
      jobRole: input.jobRole,
      professionalArea: input.professionalArea,
      conversationHistory: input.conversationHistory,
    });

    // 2. Calcular a pontuação média
    const totalScore = input.finalResults.reduce((sum, r) => sum + r.evaluation.score, 0);
    const averageScore = input.finalResults.length > 0 ? Math.round(totalScore / input.finalResults.length) : 0;

    // 3. Preparar os dados para salvar no Supabase
    const interviewData = {
      user_id: input.userId,
      job_role: input.jobRole,
      professional_area: input.professionalArea,
      results: input.finalResults, // Salva o JSON completo com P/R, feedback e scores
      overall_feedback: aiResult.overallFeedback,
      average_score: averageScore,
    };
    
    // 4. Inserir no banco de dados
    const { error: dbError } = await supabase.from('interviews').insert([interviewData]);

    if (dbError) {
      console.error("Supabase DB Error:", dbError);
      throw new Error(`Failed to save interview to database: ${dbError.message}`);
    }

    return { success: true, data: aiResult };
  } catch (error: any) {
    console.error("Error in finishInterviewAction:", error);
    return { success: false, error: error.message };
  }
}
