import { SemanticCombine } from './src/lib/semantic-combine/SemanticCombine.js';
import { NvidiaClient } from './src/lib/nemotronAPI.js';
import dotenv from 'dotenv';
dotenv.config();

// Используем nvidia nemotron
const MODEL = "nvidia/llama-3.1-nemotron-70b-instruct"; 

async function runComparisonTest() {
  console.log("==========================================");
  console.log("🆚 Vanilla Nvidia vs Sema Soul Combine 🆚");
  console.log(`🧠 Using Model: ${MODEL}`);
  console.log("==========================================\n");

  const apiKey = process.env.NVIDIA_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key found in .env (NVIDIA_API_KEY is required).");
    return;
  }

  // 1. Инициализация Клиентов
  const vanillaGemini = new NvidiaClient(apiKey);
  const combine = new SemanticCombine({ apiKey, defaultModel: MODEL });

  const tasks = [
    {
      level: "🟢 Уровень 1 (Лёгкий)",
      task: "Создай базовый компонент React, который отслеживает координаты мыши.",
      followUp: "Ой, нам нужно чтобы он еще делал debounce (задержку) обновлений."
    },
    {
      level: "🟡 Уровень 2 (Средний)",
      task: "Спроектируй структуру REST API для небольшого блога с авто-кешированием.",
      followUp: "Мы передумали, давай использовать Redis и полную инвалидацию кэша при записи."
    },
    {
      level: "🔴 Уровень 3 (Сложный)",
      task: "Спроектируй масштабируемый real-time multiplayer бэкенд используя WebSockets, CQRS и Event Sourcing.",
      followUp: "Пользователи жалуются на спайки лагов при падении узлов. Нам нужно добавить распределенную сеть (partitioned mesh network)."
    }
  ];

  for (let i = 0; i < tasks.length; i++) {
    const { level, task, followUp } = tasks[i];
    console.log(`\n\n🎯 === ЗАДАЧА ${i + 1}: ${level} ===`);
    console.log(`> Запрос: "${task}"`);
    console.log(`> Дополнение к запросу: "${followUp}"`);

    try {
      // --- Тест Vanilla Gemini ---
      console.log("\n🤖 [VANILLA GEMINI] Думает (генерирует обычный ответ)...");
      const vanillaPrompt = `Ты помощник. Как бы ты решил эту задачу? Задача: "${task}" \nА затем пользователь добавляет: "${followUp}" \nОтветь очень коротко.`;
      
      const vResponse = await vanillaGemini.models.generateContent({
        model: MODEL,
        contents: vanillaPrompt,
      });
      const vText = vResponse.text || "";
      console.log(`✅ Vanilla ответил (${vText.length} символов).`);
      console.log(`📝 Выдержка: ${vText.substring(0, 150).replace(/\n/g, " ")}...`);

      // --- Тест Sema Soul Combine ---
      console.log("\n🌌 [SEMA SOUL COMBINE] Думает (Криминализация и конструирование контекста)...");
      
      console.log(`   1️⃣ Кристаллизация Дерева Точек Сборки под задачу...`);
      const tree = await combine.crystallizeTree(task);
      console.log(`   ✨ Создан Фантом: ${tree.phantomName}`);
      console.log(`   🌲 Сгенерировано ${tree.nodes?.length || 0} узлов мировоззрения для агента:`);
      tree.nodes.slice(0, 3).forEach(n => console.log(`      - L${n.layer}: ${n.layerName} -> ${n.filename} [Концепт: ${n.concept}]`));
      if (tree.nodes.length > 3) console.log(`      ... и еще ${tree.nodes.length - 3} узлов.`);

      console.log(`\n   2️⃣ Перехват Инцептором: Пользователь меняет вектор задачи...`);
      const intercept = await combine.interceptChat(followUp, tree);
      
      console.log(`   🔄 Действие Инцептора: ${intercept.interceptorLog.action}`);
      if (intercept.interceptorLog.changes) {
         intercept.interceptorLog.changes.forEach(c => console.log(`      • ${c}`));
      }
      
      const activeCount = intercept.updatedNodes.filter(n => n.isActive).length;
      console.log(`   📡 Ответ фреймворка: ${intercept.agentResponse}`);
      console.log(`   🧠 Активных узлов контекста после смещения фокуса: ${activeCount}/${intercept.updatedNodes.length}`);
      
    } catch (e: any) {
      console.error(`\n❌ Ошибка на Задаче ${i + 1}: ${e.message}`);
    }
  }

  console.log("\n🎉 === Тест Успешно Завершен ===");
}

runComparisonTest();
