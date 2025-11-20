import { GoogleGenAI } from "@google/genai";
import { AIConfig, ServiceProvider, ChatMessage } from "../types";

type StreamCallback = (data: { content?: string; reasoning?: string }) => void;

// --- Gemini Streaming ---
const streamGemini = async (
  messages: ChatMessage[], 
  config: AIConfig,
  onUpdate: StreamCallback,
  signal?: AbortSignal
): Promise<void> => {
  if (!config.apiKey) throw new Error("API Key is required for Gemini.");
  
  const ai = new GoogleGenAI({ apiKey: config.apiKey });
  const chat = ai.chats.create({
    model: config.modelName || 'gemini-2.5-flash',
    history: messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }))
  });

  const resultStream = await chat.sendMessageStream({
      message: messages[messages.length - 1].content
  });

  for await (const chunk of resultStream) {
    if (signal?.aborted) {
      throw new Error("Aborted by user");
    }
    const text = chunk.text;
    if (text) onUpdate({ content: text });
  }
};

// --- Generic / Bailian Streaming ---
const streamGenericOpenAI = async (
  messages: ChatMessage[], 
  config: AIConfig,
  onUpdate: StreamCallback,
  signal?: AbortSignal
): Promise<void> => {
  if (!config.apiKey) throw new Error("API Key is required.");
  if (!config.baseUrl) throw new Error("Base URL is required.");

  const url = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        model: config.modelName || 'qwen-max',
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: true,
        enable_search: true, // Important for Bailian
        incremental_output: true, // Optimization for some gateways
      }),
      signal // Pass the abort signal
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`API Error ${response.status}: ${errData.error?.message || response.statusText}`);
    }

    if (!response.body) throw new Error("No response body.");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; 

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        
        const dataStr = trimmed.replace("data: ", "");
        if (dataStr === "[DONE]") return;

        try {
          const json = JSON.parse(dataStr);
          const delta = json.choices?.[0]?.delta;
          
          if (delta) {
            // Support standard DeepSeek/Bailian reasoning fields
            const reasoning = delta.reasoning_content;
            const content = delta.content;
            if (reasoning || content) {
              onUpdate({ content, reasoning });
            }
          }
        } catch (e) { /* ignore json parse errors in stream */ }
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
        throw new Error("已停止生成");
    }
    console.error("API Error:", error);
    throw new Error(`API Failed: ${error.message || error}`);
  }
};

export const streamAnalysis = async (
  messages: ChatMessage[], 
  config: AIConfig,
  onUpdate: StreamCallback,
  signal?: AbortSignal
): Promise<void> => {
  if (config.provider === ServiceProvider.GEMINI) {
    return streamGemini(messages, config, onUpdate, signal);
  } else {
    return streamGenericOpenAI(messages, config, onUpdate, signal);
  }
};