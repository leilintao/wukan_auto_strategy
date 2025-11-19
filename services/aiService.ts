import { GoogleGenAI } from "@google/genai";
import { AIConfig, ServiceProvider } from "../types";

// Gemini Handler
const callGemini = async (prompt: string, config: AIConfig): Promise<string> => {
  if (!config.apiKey) throw new Error("API Key is required for Gemini.");
  
  const ai = new GoogleGenAI({ apiKey: config.apiKey });
  
  // Using a model suitable for reasoning/long text.
  // Note: In production, prioritize 'gemini-2.5-flash' for speed or 'gemini-3-pro-preview' for complex reasoning
  const modelName = config.modelName || 'gemini-2.5-flash'; 
  
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    return response.text || "No content generated.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(`Gemini API Failed: ${error.message || error}`);
  }
};

// Generic / Bailian Handler (OpenAI Compatible)
const callGenericOpenAI = async (prompt: string, config: AIConfig): Promise<string> => {
  if (!config.apiKey) throw new Error("API Key is required.");
  if (!config.baseUrl) throw new Error("Base URL is required for Custom/Bailian.");

  const url = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelName || 'qwen-plus',
        messages: [
          { role: "system", content: "You are a helpful automotive strategy assistant." },
          { role: "user", content: prompt }
        ],
        stream: false
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`API Error ${response.status}: ${errData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No content returned.";
  } catch (error: any) {
    console.error("Bailian/Custom API Error:", error);
    throw new Error(`API Failed: ${error.message || error}`);
  }
};

export const generateAnalysis = async (prompt: string, config: AIConfig): Promise<string> => {
  if (config.provider === ServiceProvider.GEMINI) {
    return callGemini(prompt, config);
  } else {
    // Covers BAILIAN and CUSTOM
    return callGenericOpenAI(prompt, config);
  }
};