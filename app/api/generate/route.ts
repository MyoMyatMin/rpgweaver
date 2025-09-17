import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GenerateRequest, GenerateResponse, ApiErrorBody } from "@/types";
import {
  checkRateLimit,
  isNonEmptyString,
  sanitizeText,
  generateId,
  retryWithBackoff,
} from "@/lib/utils";

const MODEL_NAME = "gemini-1.5-flash-latest";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "anonymous";
}

function badRequest(message: string, details?: unknown, status = 400) {
  const body: ApiErrorBody = { error: message, details };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function okJson(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function buildEnhancedPrompt(payload: GenerateRequest): string {
  const personalityGuides = {
    Goofy:
      "Use humor, puns, and lighthearted language. Include jokes and playful responses.",
    Serious:
      "Use formal, grave language. Focus on important matters and urgent concerns.",
    Mysterious:
      "Use cryptic language, hints, and secrets. Be vague but intriguing.",
    Aggressive: "Use confrontational language, threats, and hostile responses.",
  };

  const common = `You are RPGWeaver, an expert AI assistant that generates structured RPG content.
- Always return STRICT JSON matching the requested schema exactly.
- Do not include markdown, code fences, or explanatory text.
- Keep output consistent with the game's lore and world-building.
- Create engaging, branching content that feels natural and immersive.
- Ensure dialogue flows naturally and quests have clear objectives.
`;

  if (payload.type === "dialogue") {
    const npcName = payload.npcName ?? "Unknown";
    const personality = payload.npcPersonality ?? "Mysterious";
    const situation = payload.situation ?? "General conversation";
    const personalityGuide =
      personalityGuides[personality] || personalityGuides.Mysterious;

    return `${common}
Task: Generate an NPC dialogue tree with branching conversations.

NPC Name: ${npcName}
Personality: ${personality} - ${personalityGuide}
Situation: ${situation}
Game Lore: ${payload.gameLore}

Requirements:
- Create 3-5 dialogue nodes with natural branching
- Each node should have 2-3 response options
- Use the NPC's personality consistently throughout
- Reference the game lore naturally in dialogue
- Include consequences for some choices
- Make dialogue feel authentic and engaging

Return JSON exactly matching this TypeScript type:
{
  "type": "dialogue",
  "npcName": string,
  "dialogue": Array<{"id": string, "text": string, "options": Array<{"id": string, "text": string, "nextId"?: string, "consequence"?: string}>}>,
  "metadata": {"personality": string, "mood": string, "difficulty": "Easy" | "Medium" | "Hard"}
}`;
  }

  const location = payload.location ?? "Various";
  const primaryObjective = payload.primaryObjective ?? "Assist locals";

  return `${common}
Task: Generate a compelling side quest with clear objectives.

Location: ${location}
Primary Objective: ${primaryObjective}
Game Lore: ${payload.gameLore}

Requirements:
- Create 2-4 main objectives and 1-2 optional objectives
- Include meaningful rewards (experience, gold, items)
- Reference the game lore and location naturally
- Make objectives feel connected and progressive
- Include estimated duration and difficulty
- Create engaging quest description

Return JSON exactly matching this TypeScript type:
{
  "type": "quest",
  "title": string,
  "description": string,
  "objectives": Array<{"id": string, "description": string, "type": "main" | "optional", "reward"?: string}>,
  "estimatedDuration": string,
  "difficulty": "Easy" | "Medium" | "Hard",
  "rewards": {"experience": number, "gold": number, "items"?: string[]}
}`;
}

function validatePayload(body: unknown): GenerateRequest | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Partial<GenerateRequest>;
  if (value.type !== "dialogue" && value.type !== "quest") return null;
  if (!isNonEmptyString(value.gameLore, 10)) return null;
  if (value.type === "dialogue") {
    if (
      value.npcPersonality &&
      !["Goofy", "Serious", "Mysterious", "Aggressive"].includes(
        value.npcPersonality
      )
    )
      return null;
  }
  return {
    type: value.type,
    gameLore: sanitizeText(value.gameLore!),
    npcName: value.npcName ? sanitizeText(value.npcName) : undefined,
    npcPersonality: value.npcPersonality,
    situation: value.situation ? sanitizeText(value.situation) : undefined,
    location: value.location ? sanitizeText(value.location) : undefined,
    primaryObjective: value.primaryObjective
      ? sanitizeText(value.primaryObjective)
      : undefined,
  };
}

function coerceDialogue(response: unknown): GenerateResponse | null {
  try {
    const typedResponse = response as any;
    if (typedResponse?.type !== "dialogue") return null;
    const dialogue = Array.isArray(typedResponse.dialogue)
      ? typedResponse.dialogue
      : [];
    const normalized = dialogue.map((n: any) => ({
      id: isNonEmptyString(n.id) ? n.id : generateId("node"),
      text: sanitizeText(String(n.text ?? "")),
      options: Array.isArray(n.options)
        ? n.options.map((o: any) => ({
            id: isNonEmptyString(o.id) ? o.id : generateId("opt"),
            text: sanitizeText(String(o.text ?? "")),
            nextId: isNonEmptyString(o.nextId) ? o.nextId : undefined,
            consequence: isNonEmptyString(o.consequence)
              ? o.consequence
              : undefined,
          }))
        : [],
    }));

    return {
      type: "dialogue",
      npcName: sanitizeText(String(typedResponse.npcName ?? "Unknown")),
      dialogue: normalized,
      metadata: {
        personality: sanitizeText(
          String(typedResponse?.metadata?.personality ?? "Unknown")
        ),
        mood: sanitizeText(String(typedResponse?.metadata?.mood ?? "Neutral")),
        difficulty: ["Easy", "Medium", "Hard"].includes(
          typedResponse?.metadata?.difficulty
        )
          ? typedResponse.metadata.difficulty
          : "Medium",
      },
    };
  } catch {
    return null;
  }
}

function coerceQuest(response: unknown): GenerateResponse | null {
  try {
    const typedResponse = response as any;
    if (typedResponse?.type !== "quest") return null;
    const objectives = Array.isArray(typedResponse.objectives)
      ? typedResponse.objectives
      : [];

    return {
      type: "quest",
      title: sanitizeText(String(typedResponse.title ?? "Untitled Quest")),
      description: sanitizeText(String(typedResponse.description ?? "")),
      objectives: objectives.map((o: any) => ({
        id: isNonEmptyString(o.id) ? o.id : generateId("obj"),
        description: sanitizeText(String(o.description ?? "")),
        type: o.type === "optional" ? "optional" : "main",
        reward: isNonEmptyString(o.reward) ? o.reward : undefined,
      })),
      estimatedDuration: sanitizeText(
        String(typedResponse.estimatedDuration ?? "30-60 minutes")
      ),
      difficulty: ["Easy", "Medium", "Hard"].includes(typedResponse?.difficulty)
        ? typedResponse.difficulty
        : "Medium",
      rewards: {
        experience: Number(typedResponse?.rewards?.experience ?? 100),
        gold: Number(typedResponse?.rewards?.gold ?? 25),
        items: Array.isArray(typedResponse?.rewards?.items)
          ? typedResponse.rewards.items.map((i: any) => sanitizeText(String(i)))
          : undefined,
      },
    };
  } catch {
    return null;
  }
}

function tryParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {}
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {}
  }
  return null;
}

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return badRequest("Method Not Allowed", { allowed: ["POST"] }, 405);
  }

  const ip = getClientIp(req);
  const { allowed, remaining, resetAt } = checkRateLimit(
    `gen:${ip}`,
    30,
    60_000
  );
  if (!allowed) {
    return badRequest(
      "Rate limit exceeded. Please wait before retrying.",
      { remaining, resetAt },
      429
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch (e) {
    return badRequest("Invalid JSON body");
  }

  const payload = validatePayload(json);
  if (!payload) {
    return badRequest(
      "Invalid payload. Ensure type and gameLore are provided and valid."
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return badRequest(
      "Server is not configured. Missing GEMINI_API_KEY.",
      undefined,
      500
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = buildEnhancedPrompt(payload);

    const result = await retryWithBackoff(async () => {
      return await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
    });

    const text = result.response.text();
    const parsed = tryParseJson(text);
    if (!parsed) {
      throw new Error("AI returned unstructured output");
    }

    const coerced =
      payload.type === "dialogue"
        ? coerceDialogue(parsed)
        : coerceQuest(parsed);
    if (!coerced) {
      throw new Error("AI output did not match expected schema");
    }

    return okJson(coerced, 200);
  } catch (error: any) {
    const status = typeof error?.status === "number" ? error.status : 500;
    const retryAfter = status === 429 ? 60 : undefined;

    return badRequest(
      "Failed to generate content",
      {
        message: String(error?.message ?? error),
        status,
        retryAfter,
        suggestion:
          status === 429
            ? "Try again in 1 minute"
            : "Check your input and try again",
      },
      status
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
