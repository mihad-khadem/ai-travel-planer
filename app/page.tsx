// app/page.tsx
"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("mid");
  const [mood, setMood] = useState("adventurous");
  const [days, setDays] = useState(1);
  const [itinerary, setItinerary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cache key for in-memory storage (localStorage not supported in Claude artifacts)
  const [cache, setCache] = useState<Record<string, string>>({});
  const getCacheKey = () => `${destination}-${budget}-${mood}-${days}`;

  // Check cache when parameters change
  useEffect(() => {
    const cacheKey = getCacheKey();
    if (cache[cacheKey]) {
      setItinerary(cache[cacheKey]);
    } else {
      setItinerary(""); // Clear itinerary if no cache exists
    }
  }, [destination, budget, mood, days, cache]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(""); // Clear previous errors

    // Check cache first
    const cacheKey = getCacheKey();
    if (cache[cacheKey]) {
      setItinerary(cache[cacheKey]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, budget, mood, days }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch itinerary");
      }

      // Handle streaming response
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      let result = "";
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.response) {
                result += data.response;
                setItinerary(result); // Update incrementally
              }
            } catch (parseError) {
              // Ignore JSON parse errors for partial chunks
              console.warn("Failed to parse chunk:", parseError);
            }
          }
        }
      }

      // Cache the final itinerary
      setCache((prev) => ({ ...prev, [cacheKey]: result }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Error generating itinerary:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-6 sm:p-8 font-sans">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-center">
          AI Travel Planner
        </h1>
        <p className="text-center text-gray-600 mb-6 text-base sm:text-lg">
          Create your perfect trip with a tailored itinerary
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              placeholder="Enter your destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-12 py-3 text-base text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </span>
          </div>

          <div className="relative">
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
            >
              <option value="low">Low Budget</option>
              <option value="mid">Mid-Range</option>
              <option value="luxury">Luxury</option>
            </select>
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </span>
          </div>

          <div className="relative">
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
            >
              <option value="adventurous">Adventurous</option>
              <option value="relaxing">Relaxing</option>
              <option value="cultural">Cultural</option>
              <option value="spiritual">Spiritual</option>
            </select>
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </span>
          </div>

          <div className="relative">
            <input
              type="number"
              min={1}
              max={10}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              placeholder="Number of days"
              className="w-full border border-gray-300 rounded-lg px-12 py-3 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </span>
          </div>

          <button
            type="submit"
            disabled={loading || !destination.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin mr-2 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Generating...
              </>
            ) : (
              "Generate Itinerary"
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 text-red-600 text-base bg-red-50 p-3 rounded-lg border border-red-200">
            <strong>Error:</strong> {error}
          </div>
        )}

        {itinerary && !error && (
          <div className="mt-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Your Itinerary
            </h2>
            <div className="text-base text-gray-800 whitespace-pre-wrap leading-relaxed">
              {itinerary}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
