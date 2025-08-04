// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { destination, budget, mood } = await request.json();

    if (!destination || !budget || !mood) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const prompt = `Create a 3-day travel itinerary for:
Location: ${destination}
Budget: ${budget}
Mood: ${mood}
Include daily activities, food recommendations, and cultural notes.`;

    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral",
        prompt,
        stream: false, // More predictable response time
      }),
    });

    if (!ollamaRes.ok) {
      const errorText = await ollamaRes.text();
      console.error("Ollama response error:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch from Ollama" },
        { status: 500 }
      );
    }

    const data = await ollamaRes.json();
    return NextResponse.json({ itinerary: data.response });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        error: "Something went wrong",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
