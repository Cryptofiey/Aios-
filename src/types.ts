export enum LobeType {
  PERCEPTION = "PERCEPTION",
  DRIVES = "DRIVES",
  ATTENTION = "ATTENTION",
  CONCEPT = "CONCEPT",
  DECISION = "DECISION",
  META = "META"
}

export interface Neuron {
  id: string;
  name: string;
  lobe: LobeType;
  activation: number; // 0.0 to 1.0
  baseLevel: number;
}

export interface Synapse {
  sourceId: string;
  targetId: string;
  weight: number; // -1.0 to 1.0
  stw: number; // Short term weight adjustment
  ltw: number; // Long term weight adjustment
}

export interface Biochemistry {
  energy: number; // 0.0 - 100.0
  curiosity: number; // 0.0 - 100.0
  pain: number; // 0.0 - 100.0
  pleasure: number; // 0.0 - 100.0
  boredom: number; // 0.0 - 100.0
  adrenaline: number; // 0.0 - 100.0
}

export interface EntityDNA {
  id: string;
  name: string;
  volatility: number; 
  aggression: number; 
  volatilityGap: number; 
  honestyIndex: number; 
  deceptionFrequency: number; 
  adaptationThreat: number; 
  archetype: "ACCUMULATOR" | "STRIKER" | "OBSERVER" | "MIMIC";
}

export interface CorridorLayer {
  level: string; 
  name: string;
  description: string;
  inputs: string[];
  output: string;
  confidence: number;
}

export interface AcademyLesson {
  id: string;
  title: string;
  topic: string;
  difficulty: number; 
  status: "locked" | "active" | "completed";
  prompt: string;
  solution: string;
  outputLog: string[];
}

export interface SimulationState {
  tick: number;
  biochemistry: Biochemistry;
  neurons: Neuron[];
  synapses: Synapse[];
  entities: EntityDNA[];
  decisionCorridor: CorridorLayer[];
  academyLessons: AcademyLesson[];
  activeLessonId: string | null;
  overmindFeed: string[];
}

export interface SemanticNode {
  id: string;
  filename: string;
  layer: number;
  layerName: string;
  concept: string;
  content: string;
  isActive: boolean;
  branch: string;
}

export interface SemanticTree {
  task: string;
  phantomName: string;
  nodes: SemanticNode[];
}

export interface InterceptorLog {
  action: string;
  changes: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "combine" | "agent";
  content: string;
  interceptorLog?: InterceptorLog;
}
