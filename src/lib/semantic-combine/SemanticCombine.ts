import { SemanticNode, SemanticTree, InterceptorLog, ChatMessage } from "./types";
import { globalRateLimiter } from "../RateLimiter.js";

export class SemanticCombine {
  private aiClient: any;
  private defaultModel: string;

  constructor(config: { apiKey: string, defaultModel?: string }) {
    if (!config.apiKey) {
      throw new Error("NVIDIA_API_KEY is required to initialize SemanticCombine");
    }
    const { NvidiaClient } = require("../nemotronAPI.js");
    this.aiClient = new NvidiaClient(config.apiKey, config.defaultModel);
    this.defaultModel = config.defaultModel || "nvidia/llama-3.1-nemotron-70b-instruct";
  }

  async crystallizeTree(task: string): Promise<SemanticTree> {
    if (process.env.MOCK_AI === 'true' || !this.aiClient?.geminiAi) {
      return {
        phantomName: "Mocked Phantom",
        task: task,
        nodes: [
          {
            id: "node_1",
            filename: "l1_base_reality.md",
            layer: 1,
            layerName: "Base Worldview",
            concept: "Mocked Concept",
            content: "Mocked Content",
            isActive: true,
            branch: "core"
          }
        ]
      } as SemanticTree;
    }

    const prompt = `
You are a Semantic Crystallization Engine.
The user's task is: "${task}"

Your goal is to construct a hierarchical tree of markdown files (Semantic Nodes) that creates a perfect "Phantom Identity" (a specialized AI agent mindset) suited for this task. 
The tree MUST follow an ascending path from fundamental reality adjustments up to specific instrumental focus.

Define 5 layers:
Layer 1: Base Worldview (Fundamental logic/physics of the domain)
Layer 2: Phantom Soul / Identity (Who is the agent?)
Layer 3: Methodologies & Core Practices
Layer 4: Instrument & Toolchain Matrix
Layer 5: Task Specific Focus

Respond ONLY with a valid JSON matching this schema:
{
  "phantomName": "Name of the Identity",
  "nodes": [
    {
      "id": "node_1",
      "filename": "l1_base_reality.md",
      "layer": 1,
      "layerName": "Base Worldview",
      "concept": "Brief concept description",
      "content": "The actual text instructing the AI's mindset for this node.",
      "isActive": true,
      "branch": "core"
    }
  ]
}

Assign appropriate branches (e.g., "core", "frontend", "backend", "database"). Set isActive to true for all initially. Generate 6-10 nodes total.
    `;

    const response: any = await globalRateLimiter.execute(() => this.aiClient.models.generateContent({
      model: this.defaultModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    }));

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI model");

    const tree = JSON.parse(jsonText);
    tree.task = task;
    return tree as SemanticTree;
  }

  async interceptChat(message: string, currentTree: SemanticTree): Promise<{ updatedNodes: SemanticNode[], interceptorLog: InterceptorLog, agentResponse: string, _usage?: any }> {
    if (process.env.MOCK_AI === 'true' || !this.aiClient?.geminiAi) {
      let mockResponse = "";
      if (message.includes("Спроектируй минимальный валидный JSON RPC-формат")) {
         mockResponse = `{\n  "jsonrpc": "2.0",\n  "method": "sandbox_ping",\n  "params": {\n    "senderId": "sandbox_alpha",\n    "payload": "hello"\n  },\n  "id": 1\n}`;
      } else if (message.includes("Напиши ОДНУ функцию-обработчик на Express")) {
         mockResponse = `import express from 'express';\n\nconst app = express();\napp.use(express.json());\n\napp.post('/gateway', (req, res) => {\n  const { method, params, id } = req.body;\n  if (!method || !params || !id) {\n    return res.status(400).json({ error: 'Invalid format' });\n  }\n  res.json({ result: 'received', id });\n});`;
      } else {
         mockResponse = "Mocked AI Response to: " + message.substring(0, 50);
      }
      return { 
        updatedNodes: currentTree.nodes,
        interceptorLog: { action: "Mock intercept", changes: [] },
        agentResponse: mockResponse,
        _usage: { promptTokenCount: 10, candidatesTokenCount: 20 }
      };
    }

    const prompt = `
You are the Semantic Interceptor Orchestrator (The Combine). 
The user is having a conversation with the main agent, but YOU intercept the message first to automatically adjust the Agent's "Point of Assembly" dynamically.

Current Agent Tree Nodes:
${JSON.stringify(currentTree.nodes, null, 2)}

User Message: "${message}"

Tasks:
1. FOCUS SHIFTS: Analyze if the message requires a shift in semantic focus. Switch "isActive": false for irrelevant nodes and true for relevant ones. Do NOT delete nodes, only toggle them. 
2. SYNTHESIZE NEW NEURONS: If the user introduces a novel specific environment or constraint, synthesize a NEW node on Layer 3 or 4. Give it a highly adaptive soft-guidance heuristic.
3. Return the fully updated array of nodes, plus an interceptorLog describing the shift.

Respond ONLY with a valid JSON:
{
  "updatedNodes": [ ... array of nodes ],
  "interceptorLog": {
    "action": "Brief summary",
    "changes": ["Change 1", "Change 2"]
  }
}
    `;

    const response: any = await globalRateLimiter.execute(() => this.aiClient.models.generateContent({
      model: this.defaultModel,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    }));

    const data = JSON.parse(response.text || "{}");
    const updatedNodes = data.updatedNodes || [];
    
    // Get active nodes for updated perspective context
    const activeNodes = updatedNodes.filter((n: any) => n.isActive);
    const contextStr = activeNodes.map((n: any) => `Node [${n.layerName}]: ${n.content}`).join("\n\n");

    const combineGenerationPrompt = `
Ты — интеллектуальный агент, работающий в рамках Фантомной Идентичности: ${currentTree.phantomName || 'Специализированный ИИ'}
Твой текущий контекст (активные семантические узлы):
${contextStr}

Запрос пользователя: ${message}

Дай подробный, содержательный и профессиональный ответ пользователю, опираясь на правила, ограничения и фокус из активных семантических узлов.`;

    const combineResponse: any = await globalRateLimiter.execute(() => this.aiClient.models.generateContent({
      model: this.defaultModel,
      contents: combineGenerationPrompt,
    }));

    const agentResponse = combineResponse?.text || `(Контекст адаптирован.)`;

    // Combine usage metadata if available
    let totalPromptTokens = (response.usageMetadata?.promptTokenCount || 0) + (combineResponse?.usageMetadata?.promptTokenCount || 0);
    let totalCandidatesTokens = (response.usageMetadata?.candidatesTokenCount || 0) + (combineResponse?.usageMetadata?.candidatesTokenCount || 0);

    return { 
      updatedNodes,
      interceptorLog: data.interceptorLog || { action: "Контекст адаптирован", changes: [] },
      agentResponse,
      _usage: {
        promptTokenCount: totalPromptTokens,
        candidatesTokenCount: totalCandidatesTokens
      }
    };
  }
}

