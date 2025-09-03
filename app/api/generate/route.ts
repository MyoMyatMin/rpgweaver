import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GenerateRequest, GenerateResponse, ApiErrorBody } from "@/types";
import {
  checkRateLimit,
  isNonEmptyString,
  sanitizeText,
  generateId,
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

function buildPrompt(payload: GenerateRequest): string {
  const common = `You are RPGWeaver, an assistant that generates structured RPG content.
- Always return STRICT JSON matching the requested schema.
- Do not include markdown or code fences.
- Keep output consistent with the game's lore.
`;

  if (payload.type === "dialogue") {
    const npcName = payload.npcName ?? "Unknown";
    const personality = payload.npcPersonality ?? "Mysterious";
    const situation = payload.situation ?? "General conversation";
    return `${common}
Task: Generate an NPC dialogue tree.
NPC Name: ${npcName}
Personality: ${personality}
Situation: ${situation}
Game Lore: ${payload.gameLore}

Return JSON exactly matching this TypeScript type:
{
  "type": "dialogue",
  "npcName": string,
  "dialogue": Array<{"id": string, "text": string, "options": Array<{"id": string, "text": string, "nextId"?: string, "consequence"?: string}>}>,
  "metadata": {"personality": string, "mood": string, "difficulty": "Easy" | "Medium" | "Hard"}
}`;
  }

  // quest
  const location = payload.location ?? "Various";
  const primaryObjective = payload.primaryObjective ?? "Assist locals";
  return `${common}
Task: Generate a side quest.
Location: ${location}
Primary Objective: ${primaryObjective}
Game Lore: ${payload.gameLore}

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

function coerceDialogue(response: any): GenerateResponse | null {
  try {
    if (response?.type !== "dialogue") return null;
    const dialogue = Array.isArray(response.dialogue) ? response.dialogue : [];
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
      npcName: sanitizeText(String(response.npcName ?? "Unknown")),
      dialogue: normalized,
      metadata: {
        personality: sanitizeText(
          String(response?.metadata?.personality ?? "Unknown")
        ),
        mood: sanitizeText(String(response?.metadata?.mood ?? "Neutral")),
        difficulty: ["Easy", "Medium", "Hard"].includes(
          response?.metadata?.difficulty
        )
          ? response.metadata.difficulty
          : "Medium",
      },
    };
  } catch {
    return null;
  }
}

function coerceQuest(response: any): GenerateResponse | null {
  try {
    if (response?.type !== "quest") return null;
    const objectives = Array.isArray(response.objectives)
      ? response.objectives
      : [];
    return {
      type: "quest",
      title: sanitizeText(String(response.title ?? "Untitled Quest")),
      description: sanitizeText(String(response.description ?? "")),
      objectives: objectives.map((o: any) => ({
        id: isNonEmptyString(o.id) ? o.id : generateId("obj"),
        description: sanitizeText(String(o.description ?? "")),
        type: o.type === "optional" ? "optional" : "main",
        reward: isNonEmptyString(o.reward) ? o.reward : undefined,
      })),
      estimatedDuration: sanitizeText(
        String(response.estimatedDuration ?? "30-60 minutes")
      ),
      difficulty: ["Easy", "Medium", "Hard"].includes(response?.difficulty)
        ? response.difficulty
        : "Medium",
      rewards: {
        experience: Number(response?.rewards?.experience ?? 100),
        gold: Number(response?.rewards?.gold ?? 25),
        items: Array.isArray(response?.rewards?.items)
          ? response.rewards.items.map((i: any) => sanitizeText(String(i)))
          : undefined,
      },
    };
  } catch {
    return null;
  }
}

function tryParseJson(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {}
  // attempt to extract JSON block
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
    const prompt = buildPrompt(payload);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const text = result.response.text();
    const parsed = tryParseJson(text);
    if (!parsed) {
      return badRequest("AI returned unstructured output", { text }, 502);
    }
    const coerced =
      payload.type === "dialogue"
        ? coerceDialogue(parsed)
        : coerceQuest(parsed);
    if (!coerced) {
      return badRequest(
        "AI output did not match expected schema",
        { parsed },
        502
      );
    }
    return okJson(coerced, 200);
  } catch (error: any) {
    const status = typeof error?.status === "number" ? error.status : 500;
    return badRequest(
      "Failed to generate content",
      { message: String(error?.message ?? error), status },
      status
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
