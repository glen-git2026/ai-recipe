import { createServer } from "node:http";

const PORT = Number(process.env.PORT || 8000);
const HF_API_KEY = process.env.HF_API_KEY;
const HF_MODEL = process.env.HF_MODEL || "Qwen/Qwen2.5-7B-Instruct";
const HF_API_URL = process.env.HF_API_URL || `https://api-inference.huggingface.co/models/${HF_MODEL}`;

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS,GET",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
}

function normalizeIngredients(rawIngredients) {
  if (!Array.isArray(rawIngredients)) return [];
  return rawIngredients
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, 20);
}

function asDifficulty(value) {
  if (value === "Medium" || value === "Hard") return value;
  return "Easy";
}

function sanitizeRecipe(candidate, ingredients) {
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

function buildConversationRecipe(reply) {
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

function parseModelJson(content) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const firstBrace = candidate.indexOf("{");
    const lastBrace = candidate.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
    }
    throw new Error("Model response was not valid JSON");
  }
}

async function callHuggingFace(ingredients) {
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

  const prompt = `${systemPrompt}\n\n${userPrompt}`;

  const response = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${HF_API_KEY}`,
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        temperature: 0.3,
        max_new_tokens: 1000,
        return_full_text: false,
      },
      options: {
        wait_for_model: true,
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Hugging Face request failed (${response.status}): ${message}`);
  }

  const data = await response.json();
  if (data?.error) {
    throw new Error(`Hugging Face error: ${data.error}`);
  }

  const content = Array.isArray(data)
    ? data?.[0]?.generated_text
    : data?.generated_text;

  if (!content || typeof content !== "string") {
    throw new Error("Hugging Face returned an empty response");
  }

  return parseModelJson(content);
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && req.url === "/generate") {
    try {
      const body = await readJsonBody(req);
      const ingredients = normalizeIngredients(body?.ingredients);
      const modelData = await callHuggingFace(ingredients);
      const recipe =
        modelData.mode === "chat"
          ? buildConversationRecipe(
              String(modelData.chatResponse ?? "Ready when you are. Share ingredients and I will craft a recipe.")
            )
          : sanitizeRecipe(modelData.recipe, ingredients);

      sendJson(res, 200, { recipe });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      sendJson(res, 502, { error: `Unable to generate content from Hugging Face. ${message}` });
    }
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`Recipe backend listening on http://localhost:${PORT}`);
});
