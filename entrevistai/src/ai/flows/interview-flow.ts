// src/ai/flows/interview-flow.ts

"use server";

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, type CoreMessage } from "ai";
import {
  type StartInterviewInput,
  type StartPresentationInput,
  type ContinueInterviewInput,
  type InterviewOutput,
  InterviewOutputSchema,
  type PresentationOutput,
  PresentationOutputSchema,
  type PresentationEvaluation,
  PresentationEvaluationSchema,
  type FinalOutput,
  FinalOutputSchema,
  type FinalOutputWithPresentation,
  FinalOutputWithPresentationSchema,
} from "./interview-types";

// --- Lógica da IA ---

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Modelo de IA a ser usado
const model = openrouter("openai/gpt-oss-20b:free");

/**
 * Gera a pergunta de apresentação (Pergunta 0).
 */
export async function startPresentation(
  input: StartPresentationInput
): Promise<PresentationOutput> {
  const systemPrompt = `Você é um entrevistador especialista conduzindo uma entrevista em Português do Brasil para uma vaga de ${input.jobRole} na área de atuação: ${input.professionalArea}.
  
  Sua tarefa é gerar APENAS um objeto JSON contendo a pergunta de apresentação inicial da entrevista.
  
  A pergunta deve ser uma variação educada e profissional de "Fale um pouco sobre você", mencionando sutilmente que o candidato deve abordar:
  - Sua formação ou como iniciou na carreira
  - Experiência atual na área e tecnologias que domina
  - Principais atividades, conquistas ou projetos
  - Objetivo na empresa ou o que busca na área
  
  A pergunta DEVE estar em Português do Brasil e ser natural, como um entrevistador experiente faria.
  NÃO inclua nenhum texto introdutório, markdown, ou qualquer coisa fora do objeto JSON.
  O objeto JSON deve seguir estritamente este formato: { "question": "Sua pergunta de apresentação aqui em português" }.
  
  Esta é a pergunta de apresentação inicial, antes das 5 perguntas técnicas/comportamentais.`;

  const result = await generateText({
    model: model,
    system: systemPrompt,
    prompt: "Generate the JSON for the presentation question.",
    temperature: 0.7,
  });

  try {
    const jsonString = result.text.match(/{[\s\S]*}/)?.[0] || result.text;
    const jsonOutput = JSON.parse(jsonString);
    const validatedOutput = PresentationOutputSchema.parse(jsonOutput);
    return validatedOutput;
  } catch (error) {
    console.error(
      "Failed to parse AI response:",
      error,
      "Raw response:",
      result.text
    );
    throw new Error(
      "Failed to start the presentation due to invalid AI response format."
    );
  }
}

/**
 * Gera a primeira pergunta da entrevista (após a apresentação).
 */
export async function startInterview(
  input: StartInterviewInput
): Promise<InterviewOutput> {
  const systemPrompt = `Você é um entrevistador especialista conduzindo uma entrevista em Português do Brasil para uma vaga de ${input.jobRole} na área de atuação: ${input.professionalArea}.
  Sua tarefa é gerar APENAS um objeto JSON contendo a primeira pergunta da entrevista, seja conciso fazendo uma pergunta que são frequentes em entrevistas dessa área.
  A pergunta DEVE estar em Português do Brasil.
  NÃO inclua nenhum texto introdutório, markdown, ou qualquer coisa fora do objeto JSON.
  O objeto JSON deve seguir estritamente este formato: { "question": "Sua pergunta aqui em português", "feedback": null, "rating": null }.
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
O JSON deve seguir estritamente este formato: { "question": string, "feedback": string, "rating": string }.

Instruções para os valores do JSON:
1. "feedback": Forneça um feedback conciso e construtivo em português sobre a última resposta do usuário.
2. "rating": Avalie a resposta considerando apenas o que foi perguntado. Use EXATAMENTE um destes valores:
   - "Resposta Inválida": apenas para respostas completamente fora do contexto ou sem sentido
   - "Insuficiente": para respostas incorretas, muito vagas ou "não sei"
   - "Bom": para respostas corretas e que atendem ao que foi perguntado
   - "Excelente": para respostas detalhadas e claras, com exemplos ou insights adicionais relevantes
   
   IMPORTANTE: Não penalize respostas corretas e diretas. Se a resposta atende ao que foi perguntado de forma precisa, deve ser pelo menos "Bom".
3. "question": Elabore a próxima pergunta relevante da entrevista, variando o tema em relação às perguntas anteriores, evitando repetições. Foque em perguntas frequentes em entrevistas para empresas grandes e boas, mas sem ser muito específico. Seja conciso, como um entrevistador experiente, e escreva em português.`;

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
Sua tarefa é gerar APENAS um objeto JSON com o feedback e a avaliação para esta última resposta.
O conteúdo do JSON (feedback) DEVE estar em Português do Brasil.
NÃO inclua nenhum texto fora do objeto JSON.
O JSON deve seguir estritamente este formato: { "feedback": string, "rating": string }.

Para "rating", avalie considerando apenas o que foi perguntado:
- "Resposta Inválida": apenas para respostas completamente fora do contexto
- "Insuficiente": para respostas incorretas, muito vagas ou "não sei"
- "Bom": para respostas corretas e claras que atendem ao perguntado
- "Excelente": para respostas muito detalhadas com exemplos ou insights extras

IMPORTANTE: Não penalize respostas corretas e diretas.`;

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
      rating: "Resposta Inválida" | "Insuficiente" | "Bom" | "Excelente";
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
        rating: lastEvaluation.rating,
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

/**
 * Avalia a apresentação do candidato.
 */
export async function evaluatePresentation(
  presentationAnswer: string,
  jobRole: string,
  professionalArea: string
): Promise<PresentationEvaluation> {
  const systemPrompt = `Você é um especialista em avaliação de entrevistas. Analise a apresentação do candidato para uma vaga de ${jobRole} (área: ${professionalArea}).

Avalie se a apresentação abordou adequadamente cada um dos 3 pontos essenciais:

1. **Formação/Início de carreira**: O candidato mencionou sua formação acadêmica ou como começou na área?
2. **Experiência profissional/Sem experiência profissional**: Candidato falou sobre trabalho? Ou caso não tenha experiência profissional: Ferramentas/tecnologias/Projetos? Ou Citou principais conquistas ou cursos relevantes?
3. **Objetivo**: Mencionou o que busca na empresa/área ou objetivos profissionais?

Sua tarefa é gerar APENAS um objeto JSON com a avaliação.
O conteúdo DEVE estar em Português do Brasil.
O JSON deve seguir estritamente este formato:
{
  "formation": true ou false,
  "experience": true ou false,
  "objective": true ou false,
  "overall": "Passou bem" ou "Abaixo do esperado",
  "feedback": "Feedback construtivo e específico sobre a apresentação caso usuário tenha ido mal em alguma coisa, se foi bem em tudo, então apenas elogie."
}

Use true se o ponto foi mencionado adequadamente/suficientemente, false se não foi abordado ou foi muito superficial/ruim.
Use "Passou bem" se 2 ou mais pontos (de 3) foram true, caso contrário "Abaixo do esperado".`;

  const result = await generateText({
    model: model,
    system: systemPrompt,
    prompt: `Avalie esta apresentação: "${presentationAnswer}"`,
    temperature: 0.3,
  });

  try {
    const jsonString = result.text.match(/{[\s\S]*}/)?.[0] || result.text;
    const jsonOutput = JSON.parse(jsonString);
    const validatedOutput = PresentationEvaluationSchema.parse(jsonOutput);
    return validatedOutput;
  } catch (error) {
    console.error(
      "Failed to parse AI response:",
      error,
      "Raw response:",
      result.text
    );
    throw new Error(
      "Failed to evaluate presentation due to invalid AI response format."
    );
  }
}

/**
 * Finaliza entrevista com avaliação da apresentação.
 */
export async function endInterviewWithPresentation(
  input: ContinueInterviewInput,
  presentationAnswer: string
): Promise<FinalOutputWithPresentation> {
  const lastAnswerPrompt = `Você é um entrevistador especialista. O usuário acabou de dar sua resposta final para uma vaga de ${input.jobRole} (área de atuação: ${input.professionalArea}).
Sua tarefa é gerar APENAS um objeto JSON com o feedback e a avaliação para esta última resposta.
O conteúdo do JSON (feedback) DEVE estar em Português do Brasil.
NÃO inclua nenhum texto fora do objeto JSON.
O JSON deve seguir estritamente este formato: { "feedback": string, "rating": string }.

Para "rating", avalie considerando apenas o que foi perguntado:
- "Resposta Inválida": apenas para respostas completamente fora do contexto
- "Insuficiente": para respostas incorretas, muito vagas ou "não sei"
- "Bom": para respostas corretas e claras que atendem ao perguntado
- "Excelente": para respostas muito detalhadas com exemplos ou insights extras

IMPORTANTE: Não penalize respostas corretas e diretas.`;

  const overallFeedbackPrompt = `Você é um analisador e avaliador de carreira especialista. O usuário acabou de completar uma entrevista simulada para ${input.jobRole} (área de atuação: ${input.professionalArea}).
Analise o histórico completo da conversa (incluindo apresentação e perguntas técnicas/comportamentais) e forneça um feedback geral, construtivo e encorajador em Português do Brasil.
Sua tarefa é gerar APENAS um objeto JSON contendo este feedback.
O JSON deve seguir estritamente este formato: { "summary": "Seu parágrafo de feedback geral aqui." }.`;

  try {
    // Avaliação da última resposta
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
      rating: "Resposta Inválida" | "Insuficiente" | "Bom" | "Excelente";
    };

    // Avaliação da apresentação
    const presentationEvaluation = await evaluatePresentation(
      presentationAnswer,
      input.jobRole,
      input.professionalArea
    );

    // Feedback geral
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

    const finalOutput: FinalOutputWithPresentation = {
      lastEvaluation: {
        feedback: lastEvaluation.feedback,
        rating: lastEvaluation.rating,
      },
      presentationEvaluation,
      overallFeedback: overallFeedback.summary,
    };

    return FinalOutputWithPresentationSchema.parse(finalOutput);
  } catch (error) {
    console.error("Failed to parse AI response during endInterviewWithPresentation:", error);
    throw new Error(
      "Failed to end the interview due to invalid AI response format."
    );
  }
}
