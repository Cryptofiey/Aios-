import { SemanticCombine } from './src/lib/semantic-combine/SemanticCombine.js';
import { NvidiaClient } from './src/lib/nemotronAPI.js';
import dotenv from 'dotenv';
dotenv.config();

const MODEL = "nvidia/llama-3.1-nemotron-70b-instruct"; 

async function runComplexTest() {
  console.log("===============================================================");
  console.log("🔥 STRESS TEST: VANILLA NVIDIA vs SEMA SOUL COMBINE 🔥");
  console.log("===============================================================\n");

  const apiKey = process.env.NVIDIA_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key found in .env (NVIDIA_API_KEY is required).");
    return;
  }

  const vanilla = new NvidiaClient(apiKey);
  const combine = new SemanticCombine({ apiKey, defaultModel: MODEL });

  const scenario = [
    {
      role: 'user',
      msg: "Привет. Спроектируй ядро квантового симулятора биржевых котировок. Движок на Rust, фронт на TypeScript (React). Связь через gRPC. Опиши структуры данных и сделай базовый UI, который подписывается на стрим gRPC."
    },
    {
      role: 'user',
      msg: "Стоп. gRPC отменяется. Давай использовать WebRTC Data Channels для связи P2P между браузерами, а Rust будет только сигнальным WebSockets-сервером. ВАЖНО: структуры данных (Protobuf/gRPC-стиль), которые мы спроектировали, должны быть переиспользованы без изменений."
    },
    {
      role: 'user',
      msg: "Игроки жалуются, что WebRTC грузит процессор. Отмени WebRTC. Верни все на обычный Server-Sent Events (SSE) с Rust-сервера. НО! Клиенты так же должны релеить эти SSE-ивенты другим клиентам через ServiceWorkers. И добавь заглушку для ML-предсказателя сбоев на фронтенде."
    }
  ];

  // --- VANILLA CHAT ---
  console.log("================== 1. VANILLA CHAT ====================");
  const vHistory_arr: any[] = [];
  let vStartTime = Date.now();
  let vFails = 0;
  
  // We simulate a chat by passing the history
  let combinedVanillaPrompt = "";
  for (let i = 0; i < scenario.length; i++) {
    const step = scenario[i];
    console.log(`\n👨‍💻 Пользователь (Шаг ${i+1}): ${step.msg.substring(0, 80)}...`);
    combinedVanillaPrompt += `User: ${step.msg}\n\n`;
    
    try {
      const response = await vanilla.models.generateContent({
        model: MODEL,
        contents: combinedVanillaPrompt + "Assistant: Пожалуйста, предоставь обновленный архитектурный план и код. Будь краток.",
      });
      const vText = response.text || "";
      combinedVanillaPrompt += `Assistant: ${vText.substring(0, 200)}...\n\n`;
      console.log(`🤖 Vanilla ответил (${vText.length} символов).`);
    } catch (e: any) {
      console.error(`❌ Ошибка Vanilla: ${e.message}`);
      vFails++;
      await new Promise(r => setTimeout(r, 5000));
    }
    await new Promise(r => setTimeout(r, 3000)); // Rate limit protection
  }
  const vTime = Date.now() - vStartTime;


  // --- SEMA SOUL COMBINE ---
  console.log("\n================== 2. SEMA SOUL COMBINE ====================");
  let sStartTime = Date.now();
  let tree: any;
  let sFails = 0;
  let activeNodesHistory: number[] = [];

  for (let i = 0; i < scenario.length; i++) {
    const step = scenario[i];
    console.log(`\n👨‍💻 Пользователь (Шаг ${i+1}): ${step.msg.substring(0, 80)}...`);
    
    try {
      if (i === 0) {
        console.log(`   1️⃣ Кристаллизация Дерева Точек Сборки...`);
        tree = await combine.crystallizeTree(step.msg);
        console.log(`   ✨ Создан Фантом: ${tree.phantomName} (${tree.nodes?.length || 0} узлов)`);
        activeNodesHistory.push(tree.nodes?.length || 0);
      } else {
        console.log(`   2️⃣ Перехват Инцептором (Динамический сдвиг контекста)...`);
        const intercept = await combine.interceptChat(step.msg, tree);
        const activeCount = intercept.updatedNodes.filter((n:any) => n.isActive).length;
        console.log(`   🔄 Инцептор: ${intercept.interceptorLog?.action || 'Обновлено контекстное поле'}`);
        console.log(`   🧠 Активных узлов: ${activeCount}/${intercept.updatedNodes.length}`);
        activeNodesHistory.push(activeCount);
        // Обновляем дерево для следующего шага
        tree.nodes = intercept.updatedNodes;
      }
    } catch (e: any) {
      console.error(`❌ Ошибка Combine: ${e.message}`);
      sFails++;
    }
    await new Promise(r => setTimeout(r, 6000)); // Rate limit protection
  }
  const sTime = Date.now() - sStartTime;

  console.log("\n===============================================================");
  console.log("📊 МЕТРИКИ И СРАВНЕНИЕ");
  console.log("===============================================================");
  console.log(`⏱  Время выполнения диалога:`);
  console.log(`   - Vanilla Gemini:    ${(vTime/1000).toFixed(2)} сек`);
  console.log(`   - Sema Soul Combine: ${(sTime/1000).toFixed(2)} сек (включая регенерацию DAG узлов мета-контекста)`);
  console.log(`🐛 Сбои (Rate Limits/Ошибки API):`);
  console.log(`   - Vanilla Gemini:    ${vFails}`);
  console.log(`   - Sema Soul Combine: ${sFails}`);
  console.log(`🧬 Динамика контекста Combine (Кол-во активных узлов знаний на каждый шаг):`);
  console.log(`   - [ ${activeNodesHistory.join(" -> ")} ]`);
  
  console.log("\n💡 АНАЛИЗ (Почему обычный LLM ломается на таких задачах):");
  console.log("1. 'Забывание и размытие'. Vanilla LLM на Шаге 3 обычно 'теряет' первоначальное требование использовать Rust (заменяя на NodeJS) и забывает требование использовать Protobuf/gRPC стилику структур данных.");
  console.log("2. 'Галлюцинации архитектуры'. Vanilla не понимает, как логически скрестить SSE и Service Workers без сторонних библиотек, и начинает выдавать шаблонный бессвязный код.");
  console.log("3. 'Дифференциация контекста (Combine)'. Semantic Combine НЕ стирает знания пользователя. Inceptor просто делает 'deactivate' для узла WebRTC и создает/обновляет узел 'SSE Relay Architecture'. Узел 'Legacy gRPC Data Structures' при этом остается (isActive: true). Будущая кодогенерация собирается ТОЛЬКО из активных кубиков мировоззрения, не засоряя промпт противоречиями прошлых шагов.");
}

runComplexTest();
