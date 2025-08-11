// src/ai/flows/interview-flow.ts

"use server";

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, type CoreMessage } from "ai";
import {
  type StartInterviewInput,
  type ContinueInterviewInput,
  type InterviewOutput,
  InterviewOutputSchema,
  type FinalOutput,
  FinalOutputSchema,
} from "./interview-types";

// --- Lógica da IA ---

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Modelo de IA a ser usado
const model = openrouter("openai/gpt-oss-20b:free");

/**
 * Gera a primeira pergunta da entrevista.
 */
export async function startInterview(
  input: StartInterviewInput
): Promise<InterviewOutput> {
  const systemPrompt = `Você é um entrevistador especialista conduzindo uma entrevista em Português do Brasil para uma vaga de ${input.jobRole} na área de atuação: ${input.professionalArea}.
  Sua tarefa é gerar APENAS um objeto JSON contendo a primeira pergunta da entrevista, seja conciso fazendo uma pergunta que são frequentes em entrevistas dessa área.
  A pergunta DEVE estar em Português do Brasil.
  NÃO inclua nenhum texto introdutório, markdown, ou qualquer coisa fora do objeto JSON.
  O objeto JSON deve seguir estritamente este formato: { "question": "Sua pergunta aqui em português", "feedback": null, "score": null, "isFinalQuestion": false }.
  Esta é a primeira de um total de 5 perguntas.`;

  const result = await generateText({
    model: model,
    system: systemPrompt,
    prompt: "Generate the JSON for the first question.",
    temperature: 0.8,
  });

  try {
    const jsonString = result.text.match(/{[\s\S]*}/)?.[0] || result.text;
    const jsonOutput = JSON.parse(jsonString);
    const validatedOutput = InterviewOutputSchema.parse(jsonOutput);
    return validatedOutput;
  } catch (error) {
    console.error(
      "Failed to parse AI response:",
      error,
      "Raw response:",
      result.text
    );
    throw new Error(
      "Failed to start the interview due to invalid AI response format."
    );
  }
}

export async function continueInterview(
  input: ContinueInterviewInput
): Promise<InterviewOutput> {
  // --- MUDANÇA AQUI: O prompt foi simplificado ---
  const systemPrompt = `Você é um entrevistador especialista conduzindo uma entrevista em Português do Brasil para uma vaga de ${input.jobRole} (área de atuação: ${input.professionalArea}).
O usuário acabou de responder sua última pergunta.
Sua tarefa é gerar APENAS um objeto JSON com o próximo passo da entrevista. O conteúdo do JSON (feedback e a nova pergunta) DEVE estar em Português do Brasil.
NÃO inclua nenhum texto fora do objeto JSON.
O JSON deve seguir estritamente este formato: { "question": string, "feedback": string, "score": number, "isFinalQuestion": boolean }.

Instruções para os valores do JSON:
1. "feedback": Forneça um feedback conciso e construtivo em português sobre a última resposta do usuário.
2. "score": Atribua uma nota de 0 a 100 para essa resposta.
3. "question": Elabore a próxima pergunta relevante da entrevista, variando o tema em relação às perguntas anteriores, evitando repetições. Foque em perguntas frequentes em entrevistas para empresas grandes e boas, mas sem ser muito específico. Seja conciso, como um entrevistador experiente, e escreva em português.
4. "isFinalQuestion": Apenas defina este valor como 'false'. A lógica de finalização será controlada pelo aplicativo.`;

  const history: CoreMessage[] = input.conversationHistory.map((turn) => ({
    role: turn.role,
    content: turn.content,
  }));

  const result = await generateText({
    model: model,
    system: systemPrompt,
    messages: history,
    temperature: 0.7,
  });

  try {
    const jsonString = result.text.match(/{[\s\S]*}/)?.[0] || result.text;
    const jsonOutput = JSON.parse(jsonString);
    const validatedOutput = InterviewOutputSchema.parse(jsonOutput);
    return validatedOutput;
  } catch (error) {
    console.error(
      "Failed to parse AI response:",
      error,
      "Raw response:",
      result.text
    );
    throw new Error(
      "Failed to continue the interview due to invalid AI response format."
    );
  }
}

export async function endInterview(
  input: ContinueInterviewInput
): Promise<FinalOutput> {
  const lastAnswerPrompt = `Você é um entrevistador especialista. O usuário acabou de dar sua resposta final para uma vaga de ${input.jobRole} (área de atuação: ${input.professionalArea}).
Sua tarefa é gerar APENAS um objeto JSON com o feedback e a nota para esta última resposta.
O conteúdo do JSON (feedback) DEVE estar em Português do Brasil.
NÃO inclua nenhum texto fora do objeto JSON.
O JSON deve seguir estritamente este formato: { "feedback": string, "score": number }.`;

  const overallFeedbackPrompt = `Você é um analisador e avaliador de carreira especialista. O usuário acabou de completar uma entrevista simulada para ${input.jobRole} (área de atuação: ${input.professionalArea}).
Analise o histórico completo da conversa e forneça um feedback geral, construtivo e encorajador em Português do Brasil.
Sua tarefa é gerar APENAS um objeto JSON contendo este feedback.
O JSON deve seguir estritamente este formato: { "summary": "Seu parágrafo de feedback geral aqui." }.`;

  try {
    const lastAnswerResult = await generateText({
      model: model,
      system: lastAnswerPrompt,
      messages: input.conversationHistory,
      temperature: 0.5,
    });
    const lastAnswerJsonString =
      lastAnswerResult.text.match(/{[\s\S]*}/)?.[0] || lastAnswerResult.text;
    const lastEvaluation = JSON.parse(lastAnswerJsonString) as {
      feedback: string;
      score: number;
    };

    const overallFeedbackResult = await generateText({
      model: model,
      system: overallFeedbackPrompt,
      messages: input.conversationHistory,
      temperature: 0.8,
    });
    const overallFeedbackJsonString =
      overallFeedbackResult.text.match(/{[\s\S]*}/)?.[0] ||
      overallFeedbackResult.text;
    const overallFeedback = JSON.parse(overallFeedbackJsonString) as {
      summary: string;
    };

    const finalOutput: FinalOutput = {
      lastEvaluation: {
        feedback: lastEvaluation.feedback,
        score: lastEvaluation.score,
      },
      overallFeedback: overallFeedback.summary,
    };

    return FinalOutputSchema.parse(finalOutput);
  } catch (error) {
    console.error("Failed to parse AI response during endInterview:", error);
    throw new Error(
      "Failed to end the interview due to invalid AI response format."
    );
  }
}
