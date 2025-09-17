export type GenerateType = "dialogue" | "quest";

export interface GenerateRequest {
  type: GenerateType;
  gameLore: string;
  npcName?: string;
  npcPersonality?: "Goofy" | "Serious" | "Mysterious" | "Aggressive";
  situation?: string;
  location?: string;
  primaryObjective?: string;
}

export interface DialogueOption {
  id: string;
  text: string;
  nextId?: string;
  consequence?: string;
}

export interface DialogueNode {
  id: string;
  text: string;
  options: DialogueOption[];
}

export interface DialogueResponse {
  type: "dialogue";
  npcName: string;
  dialogue: DialogueNode[];
  metadata: {
    personality: string;
    mood: string;
    difficulty: "Easy" | "Medium" | "Hard";
  };
}

export interface QuestObjective {
  id: string;
  description: string;
  type: "main" | "optional";
  reward?: string;
}

export interface QuestResponse {
  type: "quest";
  title: string;
  description: string;
  objectives: QuestObjective[];
  estimatedDuration: string;
  difficulty: "Easy" | "Medium" | "Hard";
  rewards: {
    experience: number;
    gold: number;
    items?: string[];
  };
}

export type GenerateResponse = DialogueResponse | QuestResponse;

export interface ApiErrorBody {
  error: string;
  details?: unknown;
  retryAfter?: number;
}

export interface DemoTemplate {
  id: string;
  name: string;
  description: string;
  type: GenerateType;
  data: {
    gameLore: string;
    npcName?: string;
    npcPersonality?: string;
    situation?: string;
    location?: string;
    primaryObjective?: string;
  };
}

export interface ExportFormat {
  name: string;
  extension: string;
  mimeType: string;
  transform: (data: GenerateResponse) => string;
}
