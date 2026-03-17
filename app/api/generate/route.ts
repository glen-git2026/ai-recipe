import { NextResponse } from "next/server";
const BACKEND_BASE_URL = process.env.RECIPE_API_URL;

function normalizeIngredients(rawIngredients: unknown): string[] {
  if (!Array.isArray(rawIngredients)) return [];

  return rawIngredients
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, 20);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const ingredients = normalizeIngredients((body as { ingredients?: unknown })?.ingredients);

  if (!BACKEND_BASE_URL) {
    return NextResponse.json(
      { error: "Missing RECIPE_API_URL. Set it in .env for local and in Vercel env vars for production." },
      { status: 500 }
    );
  }

  try {
    const endpoint = `${BACKEND_BASE_URL.replace(/\/$/, "")}/generate`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ingredients }),
      cache: "no-store",
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};

    if (!response.ok) {
      const backendError =
        typeof payload?.error === "string" ? payload.error : "Backend request failed";
      return NextResponse.json({ error: backendError }, { status: response.status });
    }

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Unable to reach recipe backend. ${message}` },
      { status: 502 }
    );
  }
}
