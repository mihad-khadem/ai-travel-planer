// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { destination, budget, mood } = body;

  if (!destination || !budget || !mood) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const prompt = `
You are a travel planner focused on creating a 3-day itinerary.

Location: ${destination}
Budget: ${budget}
Mood: ${mood}

Provide a structured itinerary in plain text with daily activities, places to visit, food recommendations, and cultural notes.
`;

  try {
    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3",
        prompt,
        stream: false,
      }),
    });

    if (!ollamaRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from Ollama" },
        { status: 500 }
      );
    }

    const data = await ollamaRes.json();

    return NextResponse.json({ itinerary: data.response });
  } catch (error: unknown) {
    console.error("Ollama Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate itinerary",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
