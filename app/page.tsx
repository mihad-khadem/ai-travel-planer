"use client";

import { useState } from "react";

export default function Home() {
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("mid");
  const [mood, setMood] = useState("adventurous");
  const [itinerary, setItinerary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setItinerary("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, budget, mood }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setItinerary(data.itinerary);
    } catch {
      setError("Failed to fetch itinerary");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-tr from-blue-100 via-indigo-100 to-purple-100 flex flex-col items-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-lg p-10">
        <h1 className="text-4xl font-extrabold text-indigo-700 mb-8 text-center">
          AI Travel Planner
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="destination"
              className="block text-lg font-semibold mb-2 text-gray-700"
            >
              Destination
            </label>
            <input
              id="destination"
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              placeholder="e.g., Brahmanbaria, Bangladesh"
              className="w-full border border-indigo-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label
              htmlFor="budget"
              className="block text-lg font-semibold mb-2 text-gray-700"
            >
              Budget
            </label>
            <select
              id="budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full border border-indigo-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="low">Low</option>
              <option value="mid">Mid</option>
              <option value="luxury">Luxury</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="mood"
              className="block text-lg font-semibold mb-2 text-gray-700"
            >
              Mood
            </label>
            <select
              id="mood"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full border border-indigo-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="adventurous">Adventurous</option>
              <option value="relaxing">Relaxing</option>
              <option value="cultural">Cultural</option>
              <option value="spiritual">Spiritual</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg shadow-md transition"
          >
            {loading ? "Generating Itinerary..." : "Generate Itinerary"}
          </button>
        </form>

        {error && (
          <p className="mt-6 text-center text-red-600 font-medium">{error}</p>
        )}

        {itinerary && (
          <section className="mt-10 bg-indigo-50 border border-indigo-300 rounded-xl p-6 whitespace-pre-wrap text-gray-900 leading-relaxed shadow-inner">
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">
              Your Itinerary
            </h2>
            <p>{itinerary}</p>
          </section>
        )}
      </div>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        Powered by Ollama & Next.js — Crafted by{" "}
        <span className="font-semibold">chief</span>
      </footer>
    </main>
  );
}
