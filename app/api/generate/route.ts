// api/generate/route.ts (Fixed API route)
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { destination, budget, mood, days } = await request.json();

    // Validate required parameters
    if (!destination?.trim() || !budget || !mood || !days) {
      return NextResponse.json(
        {
          error:
            "Missing required parameters. Please provide destination, budget, mood, and days.",
        },
        { status: 400 }
      );
    }

    // Validate days is a reasonable number
    if (days < 1 || days > 30) {
      return NextResponse.json(
        { error: "Days must be between 1 and 30" },
        { status: 400 }
      );
    }

    const prompt = `Create a detailed ${days}-day travel itinerary for:
Location: ${destination}
Budget: ${budget}
Travel Style: ${mood}

Please include:
- Daily activities and attractions
- Restaurant and food recommendations
- Transportation tips
- Cultural insights and local customs
- Budget considerations
- Best times to visit attractions
- Local events and festivals
- Tips for staying healthy and safe
- total costs in bdt

Format the response in a clear, day-by-day structure.`;

    // Check if Ollama is running
    let ollamaRes;
    try {
      ollamaRes = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemma2:2b",
          prompt,
          stream: true,
          options: {
            temperature: 0.7,
            top_p: 0.9,
          },
        }),
      });
    } catch (fetchError) {
      return NextResponse.json(
        {
          error:
            "Cannot connect to Ollama. Please ensure Ollama is running on localhost:11434",
        },
        { status: 503 }
      );
    }

    if (!ollamaRes.ok) {
      const errorText = await ollamaRes.text();
      return NextResponse.json(
        { error: `Ollama API error: ${ollamaRes.status} - ${errorText}` },
        { status: 500 }
      );
    }

    if (!ollamaRes.body) {
      return NextResponse.json(
        { error: "No response body from Ollama" },
        { status: 500 }
      );
    }

    // Create a ReadableStream that transforms Ollama's response to SSE format
    const stream = new ReadableStream({
      start(controller) {
        const reader = ollamaRes.body!.getReader();
        const decoder = new TextDecoder();

        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                controller.close();
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split("\n").filter((line) => line.trim());

              for (const line of lines) {
                try {
                  const data = JSON.parse(line);
                  if (data.response) {
                    // Send as Server-Sent Events format
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({
                          response: data.response,
                        })}\n\n`
                      )
                    );
                  }
                  if (data.done) {
                    controller.close();
                    return;
                  }
                } catch (parseError) {
                  console.warn(
                    "Failed to parse Ollama response line:",
                    parseError
                  );
                }
              }
            }
          } catch (error) {
            console.error("Stream error:", error);
            controller.error(error);
          }
        };

        pump();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
