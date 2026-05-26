import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health Indicator
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Helper function to call Gemini with retries and model fallbacks
  async function generateContentWithRetry(
    apiKey: string,
    params: {
      model?: string;
      contents: any;
      config?: any;
    },
    maxRetries = 2
  ) {
    const modelsToTry = [
      params.model || "gemini-3.5-flash",
      "gemini-3.1-flash-lite"
    ];

    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    let lastError: any = null;

    for (const model of modelsToTry) {
      let delay = 1000;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await ai.models.generateContent({
            ...params,
            model
          });
          return response;
        } catch (err: any) {
          lastError = err;
          console.warn(`[Gemini Retry Handler] Model ${model}, Attempt ${attempt}/${maxRetries} failed:`, err.message || err);
          
          // If it's a validation error or similar 400 bad request, retry won't help
          if (err.status === 400 || (err.message && err.message.includes("400"))) {
            break;
          }
          
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
          }
        }
      }
    }
    throw lastError || new Error("Não foi possível obter resposta do motor inteligente de IA.");
  }

  // 1. Diagnosis Suggestion Endpoint
  app.post("/api/clinical-support", async (req, res) => {
    const { symptoms } = req.body;
    if (!symptoms || symptoms.length < 5) {
      return res.status(400).json({ error: "Sintomas demasiado curtos para fornecer recomendação clínica." });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Fallback or warning
        return res.status(503).json({ 
          error: "A chave API da Google (GEMINI_API_KEY) não está configurada nos segredos do sistema. Configure-a no menu Definições." 
        });
      }

      const response = await generateContentWithRetry(apiKey, {
        model: "gemini-3.5-flash",
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
          systemInstruction: "Você é um co-piloto e assistente clínico inteligente especializado em Pediatria no Hospital Pediátrico Pioneiro Zeca em Angola. Avalie os sintomas enviados e proponha recomendações médicas baseadas em padrões aceitos e linguagem profissional em português de Angola. Lembre-se: mencione expressamente que este conselho é um suporte de triagem de IA e não uma receita médica final."
        }
      });

      const parsedData = JSON.parse(response.text || "{}");
      return res.json(parsedData);
    } catch (err: any) {
      console.error("Gemini Clinical Support Server Error:", err);
      return res.status(500).json({ 
        error: "Erro na resposta do motor inteligente de triagem: " + (err.message || "Ligação instável ou indisponível")
      });
    }
  });

  // 2. Real-time Epidemiological Dashboard Analysis / Insights Loop
  app.post("/api/ai-insights", async (req, res) => {
    const { dataSummary, prompt } = req.body;
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({ 
          text: "⚠️ A chave da Google (GEMINI_API_KEY) encontra-se desligada ou em falta nas variáveis de ambiente do painel. Por favor adicione a chave para aceder a análises demográficas em escala real." 
        });
      }

      const response = await generateContentWithRetry(apiKey, {
        model: 'gemini-3.5-flash',
        contents: `${prompt}\n\nSumário dos dados atuais de atendimento e estatística hospitalar do Lubango:\n${dataSummary}`
      });

      return res.json({ text: response.text || "Sem observações demográficas adicionais para este momento." });
    } catch (err: any) {
      console.error("Gemini AI Insights Server Error:", err);
      return res.json({ 
        text: "⚠️ Não foi possível sincronizar o motor analítico com a Gemini neste momento (Ligar chave API de secrets ou verifique conexão)." 
      });
    }
  });

  // Vite development vs production asset compiler config
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Pioneiro Zeca full-stack container running securely on port ${PORT}`);
  });
}

startServer();
