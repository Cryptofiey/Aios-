import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { NvidiaClient } from "./src/lib/nemotronAPI.js";
import dotenv from "dotenv";
import { exec } from "child_process";
import { promisify } from "util";
import { LobeType, Neuron, Synapse, Biochemistry, EntityDNA, CorridorLayer, AcademyLesson, SimulationState } from "./src/types";

const execAsync = promisify(exec);

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize SDK
const apiKey = process.env.NVIDIA_API_KEY || process.env.GEMINI_API_KEY;
let aiClient: NvidiaClient | null = null;

if (apiKey) {
  aiClient = new NvidiaClient(apiKey);
}

// Global In-Memory Simulation State
let simulationState: SimulationState = {
  tick: 0,
  biochemistry: {
    energy: 95.0,
    curiosity: 50.0,
    pain: 10.0,
    pleasure: 60.0,
    boredom: 15.0,
    adrenaline: 30.0,
  },
  neurons: [
    { id: "p1", name: "Stimulus: Retreat", lobe: LobeType.PERCEPTION, activation: 0.1, baseLevel: 0.1 },
    { id: "p2", name: "Stimulus: Aggression Spike", lobe: LobeType.PERCEPTION, activation: 0.1, baseLevel: 0.1 },
    { id: "p3", name: "Resource Depletion", lobe: LobeType.PERCEPTION, activation: 0.2, baseLevel: 0.2 },
    { id: "p4", name: "Safety Imprint High", lobe: LobeType.PERCEPTION, activation: 0.4, baseLevel: 0.2 },
    
    { id: "d1", name: "Curiosity Drive", lobe: LobeType.DRIVES, activation: 0.5, baseLevel: 0.4 },
    { id: "d2", name: "Pain Aversion", lobe: LobeType.DRIVES, activation: 0.1, baseLevel: 0.1 },
    { id: "d3", name: "Energy Need", lobe: LobeType.DRIVES, activation: 0.05, baseLevel: 0.05 },
    
    { id: "a1", name: "Focus Environment Pattern", lobe: LobeType.ATTENTION, activation: 0.3, baseLevel: 0.3 },
    { id: "a2", name: "Self Defense Priority", lobe: LobeType.ATTENTION, activation: 0.2, baseLevel: 0.2 },
    
    { id: "c1", name: "Paradigm: Accumulator", lobe: LobeType.CONCEPT, activation: 0.1, baseLevel: 0.05 },
    { id: "c2", name: "Paradigm: Striker", lobe: LobeType.CONCEPT, activation: 0.1, baseLevel: 0.05 },
    { id: "c3", name: "Paradigm: Observer", lobe: LobeType.CONCEPT, activation: 0.1, baseLevel: 0.05 },
    { id: "c4", name: "Paradigm: Mimic", lobe: LobeType.CONCEPT, activation: 0.1, baseLevel: 0.05 },
    
    { id: "de1", name: "Action: Withdraw", lobe: LobeType.DECISION, activation: 0.1, baseLevel: 0.1 },
    { id: "de2", name: "Action: Standby/Observe", lobe: LobeType.DECISION, activation: 0.1, baseLevel: 0.1 },
    { id: "de3", name: "Action: Assert/Engage", lobe: LobeType.DECISION, activation: 0.1, baseLevel: 0.1 },
    
    { id: "m1", name: "Self-Repair Diagnostics", lobe: LobeType.META, activation: 0.1, baseLevel: 0.1 },
    { id: "m2", name: "Anomaly Detection Unit", lobe: LobeType.META, activation: 0.05, baseLevel: 0.05 },
  ],
  synapses: [
    { sourceId: "p1", targetId: "c1", weight: 0.6, stw: 0.6, ltw: 0.6 }, 
    { sourceId: "p2", targetId: "c2", weight: -0.4, stw: -0.4, ltw: -0.4 }, 
    { sourceId: "p4", targetId: "c4", weight: 0.7, stw: 0.7, ltw: 0.7 }, 
    { sourceId: "d1", targetId: "a1", weight: 0.5, stw: 0.5, ltw: 0.5 }, 
    { sourceId: "c1", targetId: "de3", weight: 0.65, stw: 0.65, ltw: 0.65 }, 
    { sourceId: "c2", targetId: "de2", weight: 0.55, stw: 0.55, ltw: 0.55 }, 
    { sourceId: "c3", targetId: "de1", weight: 0.4, stw: 0.4, ltw: 0.4 }, 
    { sourceId: "c4", targetId: "de3", weight: 0.8, stw: 0.8, ltw: 0.8 }, 
  ],
  entities: [
    {
      id: "ent_01",
      name: "Accumulator Node",
      volatility: 52,
      aggression: 8,
      volatilityGap: 44,
      honestyIndex: 0.95,
      deceptionFrequency: 0.05,
      adaptationThreat: 0.2,
      archetype: "ACCUMULATOR",
    },
    {
      id: "ent_02",
      name: "Striker Node",
      volatility: 64,
      aggression: 58,
      volatilityGap: 6,
      honestyIndex: 0.25,
      deceptionFrequency: 0.85,
      adaptationThreat: 0.85,
      archetype: "STRIKER",
    },
    {
      id: "ent_03",
      name: "Observer Node",
      volatility: 14,
      aggression: 11,
      volatilityGap: 3,
      honestyIndex: 0.9,
      deceptionFrequency: 0.1,
      adaptationThreat: 0.6,
      archetype: "OBSERVER",
    },
    {
      id: "ent_04",
      name: "Mimic Node",
      volatility: 82,
      aggression: 4,
      volatilityGap: 78,
      honestyIndex: 0.5,
      deceptionFrequency: 0.3,
      adaptationThreat: 0.35,
      archetype: "MIMIC",
    },
  ],
  decisionCorridor: [
    {
      level: "L1",
      name: "Base Mathematical Expectation",
      description: "Static utility evaluation and raw baseline probabilities based on hard environment data.",
      inputs: ["Resource Context", "Physics Logic", "Base Probabilities"],
      output: "Raw EV: Withdraw (0.00), Standby (+1.25), Engage (+0.8)",
      confidence: 90,
    },
    {
      level: "L2",
      name: "Situational Calibration",
      description: "Contextual modulation based on relative stack states, energy reserves, and temporal positioning.",
      inputs: ["Relative Energy", "Vector Intensity", "Position Indices"],
      output: "State Adjusted EV: Standby (+2.4, lower risk profile), Engage (+1.9)",
      confidence: 85,
    },
    {
      level: "L3",
      name: "State Space Branching",
      description: "Calculates the dynamic probability vectors of the entity assuming varying degrees of unknown information.",
      inputs: ["Historical Action Trees", "L1 Utility Matrix"],
      output: "Entity Focus Range: 18.5% (High Variance, Exploratory Nodes active)",
      confidence: 76,
    },
    {
      level: "L4",
      name: "DNA Mutation Exploit Layer",
      description: "Filters state probabilities through the entity's bio-archetype tendencies to uncover exploitable behavior loops.",
      inputs: ["Entity DNA Profile", "Probability Vector Space"],
      output: "Exploit Vector Found: Entity Striker is over-simulating aggression. Elevate Standby to intercept-trap.",
      confidence: 92,
    },
    {
      level: "L5",
      name: "Physical Execution Layer",
      description: "Translating cognitive decisions into mechanical interface interactions with exact timing constraints.",
      inputs: ["Exploit Directive", "Motor Mapping Output"],
      output: "System Call: ENGAGE_TRAP_ROUTINE after 3800ms natural delay cycle.",
      confidence: 98,
    },
  ],
  academyLessons: [
    {
      id: "les_1",
      title: "Module Security Audit / SQL Validation",
      topic: "security-audit",
      difficulty: 3,
      status: "active",
      prompt: "Execute an internal vulnerability assessment on API module `/api/v1/data`. Detect anomalous injection parameters.",
      solution: "Vulnerability located in query string parser. Test suite synthesized to encapsulate injection and harden escaping rules.",
      outputLog: ["Initialization sequence confirmed. Cognitive lobes active."],
    },
    {
      id: "les_2",
      title: "Boundary Breach Penetration Test",
      topic: "pentest",
      difficulty: 5,
      status: "locked",
      prompt: "Investigate access control desynchronizations across private module vectors. Validate token integrity.",
      solution: "Discovered weak UUID parameterization. Overmind authorized payload isolation test.",
      outputLog: ["Constraint locked. Prerequisite required."],
    },
    {
      id: "les_3",
      title: "Traffic Heuristic Anomaly Detection",
      topic: "anomaly-detection",
      difficulty: 8,
      status: "locked",
      prompt: "Synthesize an inline heuristic based on Hebbian activation surges to identify external scanning arrays.",
      solution: "Built vector-timing architecture isolating attention spikes and enforcing automatic firewall constraints.",
      outputLog: ["Constraint locked."],
    },
  ],
  activeLessonId: null,
  overmindFeed: ["System Biological Framework Initialized.", "Neocortex Interface: STANDBY."],
};

// Start physics loop
setInterval(() => {
  simulationState.tick += 1;

  const bio = simulationState.biochemistry;
  bio.energy = Math.max(10, bio.energy - 0.25);
  bio.boredom = Math.min(100, bio.boredom + 0.3);
  
  if (bio.adrenaline > 30.0) bio.adrenaline = Math.max(30.0, bio.adrenaline - 0.5);
  else if (bio.adrenaline < 30.0) bio.adrenaline = Math.min(30.0, bio.adrenaline + 0.1);

  if (bio.pleasure > 20) bio.pleasure = Math.max(20, bio.pleasure - 0.6);
  if (bio.pain > 10) bio.pain = Math.max(10, bio.pain - 0.5);

  const updatedActivations = new Map<string, number>();
  
  for (const neuron of simulationState.neurons) {
    const decay = 0.85; 
    let rawActivation = neuron.activation * decay + neuron.baseLevel * (1 - decay);
    
    if (neuron.lobe === LobeType.DRIVES) {
      if (neuron.id === "d1") rawActivation += (bio.curiosity / 200); 
      if (neuron.id === "d2") rawActivation += (bio.pain / 300); 
      if (neuron.id === "d3") rawActivation += ((100 - bio.energy) / 400); 
    }
    
    updatedActivations.set(neuron.id, Math.min(1.0, Math.max(0.0, rawActivation)));
  }

  for (const synapse of simulationState.synapses) {
    const sourceAct = updatedActivations.get(synapse.sourceId) || 0;
    if (sourceAct > 0.3) {
      const targetAct = updatedActivations.get(synapse.targetId) || 0;
      const adrenalineCap = bio.adrenaline / 100;
      const transfer = sourceAct * synapse.weight * (0.15 + 0.1 * adrenalineCap);
      updatedActivations.set(synapse.targetId, Math.min(1.0, Math.max(0.0, targetAct + transfer)));
    }
  }

  for (const neuron of simulationState.neurons) {
    neuron.activation = updatedActivations.get(neuron.id) || neuron.baseLevel;
  }

  // Hebbian Tuning
  for (const synapse of simulationState.synapses) {
    const s = simulationState.neurons.find((n) => n.id === synapse.sourceId);
    const t = simulationState.neurons.find((n) => n.id === synapse.targetId);
    if (s && t) {
      const coFiring = s.activation > 0.4 && t.activation > 0.4;
      if (coFiring) {
        const growthStep = 0.01 + (bio.pleasure / 5000); 
        synapse.weight = Math.min(1.0, synapse.weight + growthStep);
        synapse.stw = Math.min(1.0, synapse.stw + growthStep * 1.5);
      } else if (s.activation > 0.4 && t.activation < 0.25) {
        const depletionStep = 0.005 + (bio.pain / 10000); 
        synapse.weight = Math.max(-1.0, synapse.weight - depletionStep);
        synapse.stw = Math.max(-1.0, synapse.stw - depletionStep * 1.2);
      }
      
      const ltwConvergenceRate = 0.02;
      synapse.stw = synapse.stw + (synapse.ltw - synapse.stw) * ltwConvergenceRate;
    }
  }

  // Environment Pulse
  if (simulationState.tick % 5 === 0) {
    const ent = simulationState.entities[Math.floor(Math.random() * simulationState.entities.length)];
    
    const l1 = simulationState.decisionCorridor[0];
    const l2 = simulationState.decisionCorridor[1];
    const l3 = simulationState.decisionCorridor[2];
    const l4 = simulationState.decisionCorridor[3];
    const l5 = simulationState.decisionCorridor[4];

    const aggressionSpike = Math.random() > 0.5;
    const internalConfidence = Math.random() > 0.4;

    const p1 = simulationState.neurons.find((n) => n.id === "p1");
    const p2 = simulationState.neurons.find((n) => n.id === "p2");
    const p4 = simulationState.neurons.find((n) => n.id === "p4");

    if (p1) p1.activation = aggressionSpike ? 0.05 : 0.85;
    if (p2) p2.activation = aggressionSpike ? 0.9 : 0.1;
    if (p4) p4.activation = internalConfidence ? 0.88 : 0.25;

    if (ent.archetype === "STRIKER") {
      l3.output = `Probability Vector: 45% (High noise ratio, erratic bounds, opportunistic)`;
      l4.output = `Exploit Mutation: ${ent.name} deception frequency is ${(ent.deceptionFrequency*100).toFixed(0)}%. Counter-measure formulated: Trap Engagement. Elevating EV.`;
      l5.output = `Motor System: EXECUTE DELAYED_STANDBY constraint -> Deploy Trap.`;
      
      const c2 = simulationState.neurons.find((n) => n.id === "c2");
      if (c2) c2.activation = 0.95;
    } else if (ent.archetype === "ACCUMULATOR") {
      l3.output = `Probability Vector: 12% (Extreme constraint, high-value patterns only)`;
      l4.output = `Exploit Mutation: ${ent.name} honesty is ${(ent.honestyIndex*100).toFixed(0)}%. Respect aggressive signals. Withdraw if confronted.`;
      l5.output = `Motor System: EXECUTE WITHDRAWAL constraint. Energy preservation successful.`;
      
      const c1 = simulationState.neurons.find((n) => n.id === "c1");
      if (c1) c1.activation = 0.95;
    } else {
      l3.output = `Probability Vector: 22% (Balanced environmental mapping, stable state)`;
      l4.output = `Exploit Mutation: Standard dynamic equilibrium active. No critical imbalances detected.`;
      l5.output = `Motor System: EXECUTE OBSERVATION cycle smoothly.`;
    }

    l1.confidence = Math.floor(88 + Math.random() * 6);
    l2.confidence = Math.floor(82 + Math.random() * 8);
    l3.confidence = Math.floor(70 + Math.random() * 10);
    l4.confidence = Math.floor(85 + Math.random() * 10);
    l5.confidence = Math.floor(95 + Math.random() * 4);

    simulationState.overmindFeed.unshift(
      `[T+${simulationState.tick}] L1–L5 Pathway resolving against Entity: ${ent.name} (${ent.archetype}).`
    );
    if (simulationState.overmindFeed.length > 20) {
      simulationState.overmindFeed.pop();
    }
  }
}, 3000);

app.get("/api/state", (req, res) => {
  res.json(simulationState);
});

app.post("/api/state", (req, res) => {
  const { biochemistry, neurons, entities } = req.body;
  if (biochemistry) {
    simulationState.biochemistry = { ...simulationState.biochemistry, ...biochemistry };
    simulationState.overmindFeed.unshift(`[System] Somatic chemical adjustment injected externally.`);
  }
  if (neurons && Array.isArray(neurons)) {
    for (const update of neurons) {
      const existing = simulationState.neurons.find((n) => n.id === update.id);
      if (existing) {
        existing.activation = Math.min(1.0, Math.max(0.0, update.activation));
      }
    }
  }
  if (entities && Array.isArray(entities)) {
    simulationState.entities = entities;
    simulationState.overmindFeed.unshift(`[System] Entity DNA model matrix updated.`);
  }
  res.json({ success: true, state: simulationState });
});

app.post("/api/github/push", async (req, res) => {
  const token = req.body.token || process.env.GITHUB_TOKEN;
  const repoName = req.body.repoName || process.env.GITHUB_REPO;
  const { commitMessage } = req.body;
  
  if (!token || !repoName) {
    const keys = Object.keys(process.env).filter(k => k.includes('GIT') || k.includes('TOKEN') || k.includes('REPO'));
    return res.status(400).json({ error: "Missing token or repoName", availableKeys: keys });
  }

  try {
    await execAsync(`git config --global user.name "AI Studio Agent" || true`);
    await execAsync(`git config --global user.email "agent@aistudio.google.com" || true`);
    await execAsync(`git add .`);
    
    const { stdout: status } = await execAsync(`git status --porcelain`);
    if (!status.trim()) {
      return res.json({ success: true, message: "No new changes to commit." });
    }

    const msg = commitMessage || "Auto-update from AI Studio combine agent";
    await execAsync(`git commit -m "${msg}"`);
    await execAsync(`git push "https://oauth2:${token}@github.com/${repoName}.git" HEAD:main`);

    res.json({ success: true, message: `Successfully committed and pushed to ${repoName}` });
  } catch (error: any) {
    console.error("GitHub push error:", error.message);
    let errMsg = error.message;
    if (errMsg.includes(token)) {
      errMsg = errMsg.replace(token, "[HIDDEN_TOKEN]");
    }
    res.status(500).json({ error: errMsg });
  }
});

app.post("/api/state/reset", (req, res) => {
  simulationState.tick = 0;
  simulationState.biochemistry = { energy: 95.0, curiosity: 50.0, pain: 10.0, pleasure: 60.0, boredom: 15.0, adrenaline: 30.0 };
  for (const n of simulationState.neurons) n.activation = n.baseLevel;
  for (const s of simulationState.synapses) s.stw = s.ltw;
  simulationState.activeLessonId = null;
  simulationState.overmindFeed = ["Neuro-Matrix reset. Hebbian weights neutralized."];
  res.json({ success: true, state: simulationState });
});

app.post("/api/crystallize", async (req, res) => {
  const { task } = req.body;
  
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
  }

  try {
    const { SemanticCombine } = await import("./src/lib/semantic-combine/SemanticCombine.js");
    const engine = new SemanticCombine({ apiKey });
    const tree = await engine.crystallizeTree(task);
    res.json({ success: true, tree });
  } catch (error: any) {
    console.error("Crystallize error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/interceptor/chat", async (req, res) => {
  const { message, tree } = req.body;
  if (!apiKey) return res.status(500).json({ error: "Missing API Key" });

  try {
    const { SemanticCombine } = await import("./src/lib/semantic-combine/SemanticCombine.js");
    const engine = new SemanticCombine({ apiKey });
    const result = await engine.interceptChat(message, tree);
    res.json({ success: true, ...result });
  } catch (e: any) {
    console.error("Interceptor error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/academy/start-lesson", async (req, res) => {
  const { lessonId } = req.body;
  const lesson = simulationState.academyLessons.find((l) => l.id === lessonId);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });

  lesson.status = "active";
  simulationState.activeLessonId = lessonId;
  lesson.outputLog = [
    `[Neocortex Initiated] Activating Cognitive Focus: "${lesson.title}"`,
    `[Drive] Objective Parameters: ${lesson.prompt}`,
    `[System] Spiking Perception & Curiosity Lobes...`,
  ];

  simulationState.biochemistry.curiosity = 95.0;
  simulationState.biochemistry.adrenaline = 85.0;

  if (aiClient) {
    try {
      const taskResponse = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are the Neocortical component of a biological AI system acting as an instructor.
        Provide a concise strategic summary for learning to handle: "${lesson.title}". Theme: "${lesson.topic}".
        Constraint: 1 short paragraph, technical operations focus.`,
      });

      const tutorText = taskResponse.text || "Strategic frameworks established.";
      lesson.outputLog.push(`[Neocortex Guidance] ${tutorText}`);
      simulationState.overmindFeed.unshift(`[System] Conceptual parameters imported from Neocortex.`);

      const internalResponse = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are the Biological Instinctual executing core reporting back to the analytical Neocortex.
        Goal: "${lesson.prompt}". Neocortex Context: "${tutorText}".
        Simulate a raw, objective operations log reporting how the vulnerability was secured via Hebbian adaptations.
        Keep it concise, machine-like.`,
      });

      const internalLog = internalResponse.text || "System operations complete.";
      lesson.outputLog.push(`[Somatic Core Execution] ${internalLog}`);
      
      simulationState.biochemistry.energy -= 10; 
      simulationState.biochemistry.pleasure = 90.0;
      simulationState.biochemistry.pain = 5.0; 

      const c_nodes = simulationState.neurons.filter(n => n.lobe === LobeType.CONCEPT || n.lobe === LobeType.META);
      c_nodes.forEach(node => node.activation = 0.95);

      lesson.status = "completed";
      simulationState.activeLessonId = null;
      
      const currentIndex = simulationState.academyLessons.findIndex(l => l.id === lessonId);
      if (currentIndex !== -1 && currentIndex + 1 < simulationState.academyLessons.length) {
        simulationState.academyLessons[currentIndex + 1].status = "active";
        lesson.outputLog.push(`[Neuro-Plasticity] Pathway unlocked: Cognitive pattern ${simulationState.academyLessons[currentIndex + 1].title} now accessible.`);
      }

      lesson.outputLog.push(`[Synaptic Growth] Reward mechanism triggered. Neural weights hardened.`);
      simulationState.overmindFeed.unshift(`[Success] Concept architecture stabilized for: ${lesson.title}.`);

    } catch (err: any) {
      console.error("API error fallback", err);
      fallbackOfflineSession(lesson);
    }
  } else {
    fallbackOfflineSession(lesson);
  }

  res.json({ success: true, lesson: lesson, state: simulationState });
});

function fallbackOfflineSession(lesson: AcademyLesson) {
  setTimeout(() => {
    lesson.outputLog.push(`[Internal Loop] External LLM unreachable. Booting offline recursive heuristics...`);
    lesson.outputLog.push(`[Simulation] Probing environment vectors for task: ${lesson.prompt.substring(0, 40)}...`);
    lesson.outputLog.push(`[Discovery] Edge case identified. Structural integrity breach located at vector intersection.`);
    lesson.outputLog.push(`[Patch] Applying topological constraints. Regulating activation thresholds.`);
    lesson.outputLog.push(`[Resolution] Routine stabilized. Meta-lobes saturated.`);
    
    lesson.status = "completed";
    simulationState.activeLessonId = null;
    simulationState.biochemistry.pleasure = 75.0;
    simulationState.biochemistry.energy -= 8;

    const currentIndex = simulationState.academyLessons.findIndex(l => l.id === lesson.id);
    if (currentIndex !== -1 && currentIndex + 1 < simulationState.academyLessons.length) {
      simulationState.academyLessons[currentIndex + 1].status = "active";
    }
  }, 2000);
}

import { runResearchTest, getTestMessages, isTestRunning, getTestMetrics } from "./src/lib/testRunner.js";

app.get("/api/test/stream", (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const sendData = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendData({ type: 'history', messages: getTestMessages(), isRunning: isTestRunning(), metrics: getTestMetrics() });

  let lastIndex = getTestMessages().length;
  let lastMetricsStr = JSON.stringify(getTestMetrics());

  const interval = setInterval(() => {
    const msgs = getTestMessages();
    const currentMetrics = getTestMetrics();
    const currentMetricsStr = JSON.stringify(currentMetrics);
    
    if (msgs.length > lastIndex || currentMetricsStr !== lastMetricsStr) {
      const newMessages = msgs.slice(lastIndex);
      sendData({ type: 'new_messages', messages: newMessages, isRunning: isTestRunning(), metrics: currentMetrics });
      lastIndex = msgs.length;
      lastMetricsStr = currentMetricsStr;
    } else {
      // Keep-alive heartbeat
      sendData({ type: 'ping', isRunning: isTestRunning(), metrics: currentMetrics });
    }
  }, 1000);

  req.on('close', () => clearInterval(interval));
});

app.post("/api/test/start", async (req, res) => {
  if (isTestRunning()) return res.json({ success: false, msg: "Test is already running" });
  if (!apiKey) return res.status(500).json({ error: "No API Key" });
  
  // Non-blocking start
  runResearchTest(apiKey).catch(console.error);
  res.json({ success: true, msg: "Test started" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Cognitive Core] Back-end architecture online on ${PORT}`);
  });
}

startServer();
