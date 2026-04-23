import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const geminiService = {
  async getClinicalSupport(symptoms: string) {
    if (!symptoms || symptoms.length < 5) return null;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analise estes sinais e sintomas pediátricos e sugira possíveis diagnósticos e nível de urgência: "${symptoms}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              possibleDiagnoses: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              urgencyLevel: {
                type: Type.STRING,
                enum: ["Baixa", "Moderada", "Alta", "Emergência"]
              },
              briefAdvice: { type: Type.STRING }
            },
            required: ["possibleDiagnoses", "urgencyLevel", "briefAdvice"]
          },
          systemInstruction: "Você é um assistente de triagem pediátrica altamente especializado. Forneça sugestões baseadas em protocolos clínicos internacionais. Importante: Inclua um aviso de que isso é apenas suporte à decisão e não substitui o diagnóstico médico."
        }
      });

      return JSON.parse(response.text);
    } catch (err) {
      console.error("Gemini Clinical Support Error:", err);
      return null;
    }
  }
};
