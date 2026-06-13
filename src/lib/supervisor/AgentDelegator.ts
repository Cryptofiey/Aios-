import { SemanticCombine } from '../semantic-combine/SemanticCombine.js';
import { ApiManager } from '../api-manager/ApiManager.js';

export interface SubAgentContext {
  id: string;
  phantomName: string;
  taskDescription: string;
  status: 'pending' | 'running' | 'evaluating' | 'completed' | 'failed';
  engine: SemanticCombine;
  tree: any;
  result?: string;
  logs: string[];
}

/**
 * AgentDelegator (Супервизор)
 * Отвечает за создание суб-агентов через Sema Soul Combine, 
 * постановку им задач, мониторинг выполнения и оценку результатов.
 */
export class AgentDelegator {
  private activeAgents: Map<string, SubAgentContext> = new Map();
  private apiManager: ApiManager;
  private maxConcurrent: number = 5;
  private currentRunning: number = 0;
  private taskQueue: Array<() => Promise<void>> = [];

  constructor() {
    this.apiManager = ApiManager.getInstance();
  }

  private log(agentId: string, message: string) {
    const context = this.activeAgents.get(agentId);
    if (context) {
      context.logs.push(`[${new Date().toISOString()}] ${message}`);
    }
    console.log(`[Supervisor -> ${agentId}] ${message}`);
  }

  private async processQueue() {
    if (this.currentRunning >= this.maxConcurrent || this.taskQueue.length === 0) {
      return;
    }
    
    this.currentRunning++;
    const task = this.taskQueue.shift();
    if (task) {
      try {
        await task();
      } finally {
        this.currentRunning--;
        this.processQueue(); // Запускаем следующего в очереди
      }
    } else {
      this.currentRunning--;
    }
  }

  /**
   * Делегирует задачу новому суб-агенту (До 5 одновременно в Рое)
   */
  public async delegateTask(
    phantomRole: string, 
    taskDescription: string, 
    model: string = 'nvidia/llama-3.1-nemotron-70b-instruct'
  ): Promise<string> {
    const apiKey = this.apiManager.requireKey('nvidia');
    const agentId = `agent_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // 1. Инициализация контекста
    const engine = new SemanticCombine({ apiKey, defaultModel: model });
    const context: SubAgentContext = {
      id: agentId,
      phantomName: phantomRole,
      taskDescription,
      status: 'pending',
      engine,
      tree: null,
      logs: []
    };
    
    this.activeAgents.set(agentId, context);
    this.log(agentId, `Spawning sub-agent [${phantomRole}] for task: ${taskDescription}`);

    return new Promise((resolve, reject) => {
      const executeTask = async () => {
        try {
          // 2. Кристаллизация Дерева (создание личности и рабочих фреймов агента)
          context.status = 'running';
          this.log(agentId, `Crystallizing semantic tree...`);
          
          const tree = await engine.crystallizeTree(`Ты — ${phantomRole}. Тебе поручена задача: ${taskDescription}`);
          tree.phantomName = phantomRole;
          context.tree = tree;

          // 3. Выполнение задачи (первый цикл)
          this.log(agentId, `Intercepting task execution...`);
          let interceptResult = await engine.interceptChat(taskDescription, tree);
          
          // 4. Супервизия и Оценка (Оценка качества результата)
          context.status = 'evaluating';
          let finalResult = interceptResult.agentResponse;
          let isSatisfactory = await this.evaluateResult(taskDescription, finalResult);
          
          if (!isSatisfactory) {
            this.log(agentId, `Result did not pass evaluation. Requesting revision...`);
            const revisionPrompt = "Результат слишком короткий или не покрывает все требования задачи. Пожалуйста, проведи более глубокий анализ и предоставь развернутый ответ.";
            const revision = await engine.interceptChat(revisionPrompt, tree);
            finalResult = revision.agentResponse;
          } else {
            this.log(agentId, `Result approved by supervisor.`);
          }

          context.result = finalResult;
          context.status = 'completed';
          resolve(context.result);

        } catch (error: any) {
          context.status = 'failed';
          this.log(agentId, `Task failed: ${error?.message || error}`);
          reject(new Error(`[Supervisor] Agent ${phantomRole} failed: ${error}`));
        }
      };

      this.taskQueue.push(executeTask);
      this.processQueue();
    });
  }

  /**
   * Оценка качества работы суб-агента.
   * В полноценной ОС здесь будет вызван LLM-судья.
   */
  private async evaluateResult(taskDescription: string, result: string): Promise<boolean> {
    // Временная эвристика супервизора:
    if (!result || result.trim().length < 50) return false;
    
    // TODO: Интеграция с Nemotron / отдельным Critic Agent для проверки кода/текста
    return true;
  }

  public getAgentStatus(agentId: string): SubAgentContext | undefined {
    return this.activeAgents.get(agentId);
  }
  
  public getAllAgents(): SubAgentContext[] {
    return Array.from(this.activeAgents.values());
  }
}
