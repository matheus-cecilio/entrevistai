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
  } catch (error: unknown) {
    console.error("Error in finishInterviewAction:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Action para deletar uma entrevista específica do usuário
 */
export async function deleteInterviewAction(interviewId: string) {
  try {
    const supabase = await createClient();

    // Verificar se o usuário está autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Usuário não autenticado");
    }

    // Deletar a entrevista (RLS garante que só pode deletar suas próprias entrevistas)
    const { error: deleteError } = await supabase
      .from('interviews')
      .delete()
      .eq('id', interviewId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error("Supabase Delete Error:", deleteError);
      throw new Error(`Falha ao deletar entrevista: ${deleteError.message}`);
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Error in deleteInterviewAction:", error);
    return { 
      success: false, 
      error: error instanceof Error ? (error.message || "Erro desconhecido ao deletar entrevista") : "Erro desconhecido ao deletar entrevista" 
    };
  }
}

/**
 * Action para deletar a conta do usuário e todos os dados associados
 */
export async function deleteUserAccountAction() {
  try {
    const supabase = await createClient();

    // Verificar se o usuário está autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Usuário não autenticado");
    }

    const userId = user.id;

    // 1. Deletar todas as entrevistas do usuário (RLS aplicado automaticamente)
    const { error: interviewsError } = await supabase
      .from('interviews')
      .delete()
      .eq('user_id', userId);

    if (interviewsError) {
      console.error("Error deleting interviews:", interviewsError);
      throw new Error(`Falha ao deletar entrevistas: ${interviewsError.message}`);
    }

    // 2. Deletar o perfil do usuário (RLS aplicado automaticamente)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
      throw new Error(`Falha ao deletar perfil: ${profileError.message}`);
    }

    // 3. Tentar deletar o usuário da autenticação usando service role key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let warning = null;
    let message = "Dados deletados com sucesso.";

    if (serviceRoleKey) {
      try {
        const deleteUserResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json',
              'apikey': serviceRoleKey
            }
          }
        );

        if (!deleteUserResponse.ok) {
          const errorData = await deleteUserResponse.text();
          console.error('Error deleting user from auth:', errorData);
          warning = 'Dados deletados com sucesso, mas não foi possível remover o usuário da autenticação. Faça logout manualmente.';
        } else {
          message = 'Conta deletada completamente com sucesso.';
        }
        
      } catch (authError) {
        console.error('Error in auth deletion:', authError);
        warning = 'Dados deletados com sucesso, mas houve um problema ao remover o usuário da autenticação.';
      }
    } else {
      // Service role key não está configurada
      console.warn('SUPABASE_SERVICE_ROLE_KEY not found. Only user data was deleted.');
      warning = 'Dados deletados com sucesso. Para deletar completamente a conta da autenticação, configure SUPABASE_SERVICE_ROLE_KEY no .env';
    }

    // 4. Fazer logout do usuário
    await supabase.auth.signOut();

    return { 
      success: true, 
      warning: warning,
      message: message
    };
  } catch (error: unknown) {
    console.error("Error in deleteUserAccountAction:", error);
    return { 
      success: false, 
      error: error instanceof Error ? (error.message || "Erro desconhecido ao deletar conta") : "Erro desconhecido ao deletar conta" 
    };
  }
}
