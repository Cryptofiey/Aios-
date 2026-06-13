import { GoogleGenAI } from "@google/genai";

export async function fetchNemotronResponse(apiKey: string, messages: any[], model: string = "nvidia/llama-3.1-nemotron-70b-instruct") {
  const url = "https://integrate.api.nvidia.com/v1/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Nemotron API Error: ${response.status} ${response.statusText} - ${text}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export class NvidiaClient {
  private apiKey: string;
  private defaultModel: string;
  private geminiAi: any = null;

  constructor(apiKey: string, defaultModel: string = "gemini-2.5-flash") {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
    if (this.defaultModel.includes('gemini') || this.apiKey.startsWith('AIza')) {
       this.geminiAi = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  public models = {
    generateContent: async (args: { model?: string, contents: string, config?: any }) => {
      const modelName = args.model || this.defaultModel;
      
      if (this.geminiAi && (modelName.includes('gemini') || this.apiKey.startsWith('AIza'))) {
         let sysInstruction = undefined;
         if (args.config?.responseMimeType === "application/json") {
             sysInstruction = "You must respond with valid JSON only. Do not wrap it in markdown block quotes.";
         }
         const response = await this.geminiAi.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: args.contents,
             config: {
                 systemInstruction: sysInstruction,
                 responseMimeType: args.config?.responseMimeType,
                 temperature: 0.7
             }
         });
         
         let text = response.text || "";
         if (args.config?.responseMimeType === "application/json") {
            text = text.replace(/```json/g, "").replace(/```/g, "").trim();
         }
         
         return {
            text,
            usageMetadata: response.usageMetadata
         };
      }

      // Nvidia 
      const model = modelName;
      const url = "https://integrate.api.nvidia.com/v1/chat/completions";
      
      let systemPrompt = "";
      if (args.config?.responseMimeType === "application/json") {
         systemPrompt = "You must respond with valid JSON only.";
      }

      const messages: any[] = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: args.contents });

      const bodyPayload: any = {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4096,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(bodyPayload)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Nemotron API Error: ${response.status} ${response.statusText} - ${text}`);
      }

      const data = await response.json();
      let text = data.choices && data.choices.length > 0 ? data.choices[0].message.content : "";
      
      if (args.config?.responseMimeType === "application/json") {
         text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      }

      return {
        text,
        usageMetadata: {
           promptTokenCount: data.usage?.prompt_tokens || 0,
           candidatesTokenCount: data.usage?.completion_tokens || 0
        }
      };
    }
  }
}

