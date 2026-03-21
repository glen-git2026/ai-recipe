import { NextResponse } from "next/server";

type Difficulty = "Easy" | "Medium" | "Hard";

interface Recipe {
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  difficulty: Difficulty;
  ingredients: { item: string; amount: string }[];
  instructions: string[];
  tips: string;
}

interface ModelResponseShape {
  mode?: "recipe" | "chat";
  chatResponse?: string;
  recipe?: Partial<Recipe>;
}

const HF_API_KEY = process.env.HF_API_KEY;
const HF_MODEL = process.env.HF_MODEL || "Qwen/Qwen2.5-7B-Instruct";
const HF_API_URL =
  process.env.HF_API_URL || "https://router.huggingface.co/v1/chat/completions";

function normalizeIngredients(rawIngredients: unknown): string[] {
  if (!Array.isArray(rawIngredients)) return [];

  return rawIngredients
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, 20);
}

function asDifficulty(value: unknown): Difficulty {
  if (value === "Medium" || value === "Hard") return value;
  return "Easy";
}

function sanitizeRecipe(candidate: Partial<Recipe> | undefined, ingredients: string[]): Recipe {
  const fallbackIngredients =
    ingredients.length > 0 ? ingredients : ["Mixed vegetables", "Olive oil", "Salt", "Pepper"];

  const safeIngredients = Array.isArray(candidate?.ingredients)
    ? candidate.ingredients
        .map((item) => ({
          item: String(item?.item ?? "").trim(),
          amount: String(item?.amount ?? "").trim(),
        }))
        .filter((item) => item.item && item.amount)
        .slice(0, 20)
    : [];

  const safeInstructions = Array.isArray(candidate?.instructions)
    ? candidate.instructions
        .map((step) => String(step ?? "").trim())
        .filter(Boolean)
        .slice(0, 12)
    : [];

  return {
    title: String(candidate?.title ?? "Chef's Signature Bowl").trim() || "Chef's Signature Bowl",
    description:
      String(candidate?.description ?? "A balanced dish crafted from your available ingredients.").trim() ||
      "A balanced dish crafted from your available ingredients.",
    prepTime: String(candidate?.prepTime ?? "10 mins").trim() || "10 mins",
    cookTime: String(candidate?.cookTime ?? "20 mins").trim() || "20 mins",
    servings: Math.max(1, Number(candidate?.servings ?? 2) || 2),
    difficulty: asDifficulty(candidate?.difficulty),
    ingredients:
      safeIngredients.length > 0
        ? safeIngredients
        : fallbackIngredients.map((item) => ({ item, amount: "to taste" })),
    instructions:
      safeInstructions.length > 0
        ? safeInstructions
        : [
            "Prepare and measure all ingredients.",
            "Cook using medium heat and adjust seasoning gradually.",
            "Plate while hot and finish with fresh herbs.",
          ],
    tips:
      String(candidate?.tips ?? "Taste at each step and season in layers for better depth.").trim() ||
      "Taste at each step and season in layers for better depth.",
  };
}

function buildConversationRecipe(reply: string): Recipe {
  return {
    title: "Chef's Reply",
    description: reply,
    prepTime: "0 mins",
    cookTime: "0 mins",
    servings: 1,
    difficulty: "Easy",
    ingredients: [{ item: "Conversation", amount: "1 message" }],
    instructions: [reply],
    tips: "Ask for a recipe anytime by listing ingredients like: chicken, rice, tomato.",
  };
}

function parseModelJson(content: string): ModelResponseShape {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;

  try {
    return JSON.parse(candidate) as ModelResponseShape;
  } catch {
    const firstBrace = candidate.indexOf("{");
    const lastBrace = candidate.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(candidate.slice(firstBrace, lastBrace + 1)) as ModelResponseShape;
    }
    throw new Error("Model response was not valid JSON");
  }
}

async function callHuggingFace(ingredients: string[]): Promise<ModelResponseShape> {
  if (!HF_API_KEY) {
    throw new Error("Missing HF_API_KEY on backend");
  }

  const systemPrompt = `You are Chef Atlas, a precise culinary assistant.
You must output JSON only.

Rules:
1) If the user request is about food, recipes, meal planning, cooking technique, substitutions, nutrition, or ingredient usage, set mode to "recipe" and return a complete recipe object.
2) If the user request is general chat, greeting, joke, or non-food conversation, set mode to "chat" and return a short witty helpful chatResponse.
3) For recipe mode, be precise and realistic with times, quantities, and steps.
4) Never include markdown, code fences, or extra keys.

Exact JSON schema:
{
  "mode": "recipe" | "chat",
  "chatResponse": "string when mode=chat",
  "recipe": {
    "title": "string",
    "description": "string",
    "prepTime": "string",
    "cookTime": "string",
    "servings": 2,
    "difficulty": "Easy" | "Medium" | "Hard",
    "ingredients": [{ "item": "string", "amount": "string" }],
    "instructions": ["string"],
    "tips": "string"
  }
}`;

  const userPrompt =
    ingredients.length > 0
      ? `User ingredients/input: ${ingredients.join(", ")}`
      : "User input: Provide a helpful response. If no food context, use chat mode.";

  const response = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${HF_API_KEY}`,
    },
    body: JSON.stringify({
      model: HF_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Hugging Face request failed (${response.status}): ${message}`);
  }

  const data = await response.json();
  if (data?.error) {
    throw new Error(`Hugging Face error: ${data.error}`);
  }

  const content = data?.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string") {
    throw new Error("Hugging Face returned an empty response");
  }

  return parseModelJson(content);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const ingredients = normalizeIngredients((body as { ingredients?: unknown })?.ingredients);

  if (!HF_API_KEY) {
    return NextResponse.json(
      { error: "Missing HF_API_KEY. Set it in .env for local and in Vercel env vars for production." },
      { status: 500 }
    );
  }

  try {
    const modelData = await callHuggingFace(ingredients);
    const recipe =
      modelData.mode === "chat"
        ? buildConversationRecipe(
            String(modelData.chatResponse ?? "Ready when you are. Share ingredients and I will craft a recipe.")
          )
        : sanitizeRecipe(modelData.recipe, ingredients);

    return NextResponse.json({ recipe }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Unable to generate content from Hugging Face. ${message}` },
      { status: 502 }
    );
  }
}
