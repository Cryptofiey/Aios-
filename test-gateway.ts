process.env.MOCK_AI = 'true';
import { AgentDelegator } from './src/lib/supervisor/AgentDelegator.js';
import dotenv from 'dotenv';
dotenv.config();

async function runGatewayAudit() {
  console.log("===============================================================");
  console.log("🌌 ПРОВЕРКА РОЯ: Cross-Sandbox Gateway Audit 🌌");
  console.log("===============================================================\n");

  const delegator = new AgentDelegator();
  
  console.log("[SUPERVISOR] Делегирование задачи 1: Архитектор (проектирование API)...");
  
  const startTime = Date.now();
  let archResult = "";
  try {
    archResult = await delegator.delegateTask(
      "Gateway Architect",
      "Ты — Архитектор шлюза P2P. Спроектируй минимальный валидный JSON RPC-формат (3-4 поля) для обмена сообщениями (Gateway Payload) между двумя песочницами (Node.js). Ответь кратко, только суть и пример JSON.",
      "gemini-2.5-flash"
    );
    console.log("\n[ARCHITECT RESULT] =======================");
    console.log(archResult);
    console.log("==========================================\n");
  } catch (e: any) {
    console.error("Architect failed:", e.message);
    return;
  }

  console.log("[SUPERVISOR] Делегирование задачи 2: Инженер (реализация Express Node)...");
  
  let engResult = "";
  try {
    engResult = await delegator.delegateTask(
      "Gateway Engineer",
      `Ты — Инженер-программист шлюза. Архитектор передал тебе формат: \n\n${archResult}\n\nНапиши ОДНУ функцию-обработчик на Express (Node.js), которая принимает этот JSON, валидирует его (что нужные поля есть) и возвращает статус 'received'. Дай только код TypeScript без лишних рассуждений.`,
      "gemini-2.5-flash"
    );
    console.log("\n[ENGINEER RESULT] ========================");
    console.log(engResult);
    console.log("==========================================\n");
  } catch (e: any) {
    console.error("Engineer failed:", e.message);
  }

  const durationStr = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log("\n===============================================================");
  console.log("📊 АУДИТ МЕТРИК МНОГОАГЕНТНОЙ АКТИВНОСТИ");
  console.log("===============================================================");
  const agents = delegator.getAllAgents();
  
  console.log(`⏱ Общее время работы Роя: ${durationStr} сек`);
  console.log(`🤖 Всего агентов порождено: ${agents.length}`);
  
  agents.forEach(agent => {
    console.log(`\n🔹 Phantom ID: ${agent.id} (Роль: ${agent.phantomName})`);
    console.log(`   🔸 Статус: ${agent.status}`);
    console.log(`   🔸 Дерево (Узлов мировоззрения): ${agent.tree?.nodes?.length || 0}`);
    console.log(`   🔸 Размер итогового результата: ${agent.result?.length || 0} символов`);
    console.log(`   🔸 Логи: ${agent.logs.length} шагов задокументировано`);
  });
  
  console.log("\n✅ Тестирование кросс-сэндбокс шлюза и аудит системы T.A.E завершены!");
}

runGatewayAudit();
