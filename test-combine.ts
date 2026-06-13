import { SemanticCombine } from './src/lib/semantic-combine/SemanticCombine.js';
import dotenv from 'dotenv';
dotenv.config();

async function runTest() {
  console.log("=== Sema Soul Combine Test ===");
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("No API key found in .env (GEMINI_API_KEY is required).");
      return;
    }
    const combine = new SemanticCombine({ apiKey });
    
    console.log("1. Crystallizing tree for task: 'Build a Next.js app with Prisma'");
    const tree = await combine.crystallizeTree("Build a Next.js app with Prisma");
    console.log(`\n✅ Phantom Created: ${tree.phantomName}`);
    console.log(`✅ Generated ${tree.nodes?.length || 0} nodes.\n`);
    
    console.log("2. Intercepting Chat: 'We decided to use Drizzle instead of Prisma.'");
    const result = await combine.interceptChat("We decided to use Drizzle instead of Prisma.", tree);
    console.log("\n✅ Interceptor Log:");
    console.log(JSON.stringify(result.interceptorLog, null, 2));
    console.log("\n✅ Agent Response:");
    console.log(result.agentResponse);
    console.log("\n🚀 Test Completed Successfully!");
  } catch (error) {
    console.error("❌ Test Failed:", error);
  }
}

runTest();
