"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Game, ApiGame } from "@/types/interfaces";

export default function Guides() {
  const [search, setSearch] = useState("");
  const [games, setGames] = useState<Game[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch("/api/games");
        if (!response.ok) throw new Error("Failed to fetch games");

        const data: ApiGame[] = await response.json();

        // Κανονικοποίηση των δεδομένων
        const normalizedGames: Game[] = data.map((game) => ({
          id: game.id,
          title: game.title,
          platform: game.platform,
          game_image: game.game_image,
          trophies: {
            Platinum: String(game.platinum),
            Gold: String(game.gold),
            Silver: String(game.silver),
            Bronze: String(game.bronze),
          },
          totalPoints: game.platinum * 300 + game.gold * 90 + game.silver * 30 + game.bronze * 15,
          steps: [],
        }));

        setGames(normalizedGames);
      } catch (err) {
        console.error("❌ Σφάλμα στη φόρτωση των παιχνιδιών:", err);
        setError("Σφάλμα κατά τη φόρτωση των παιχνιδιών.");
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const filteredGames = (games ?? []).filter((game) =>
    game.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      {/* Τίτλος */}
      <h1 className="text-5xl font-extrabold text-blue-400 mb-6 flex items-center">
        📜 Trophy Guides
      </h1>

      {/* Search Bar */}
      <div className="relative w-full max-w-lg">
        <input
          type="text"
          placeholder="🔎 Αναζήτηση παιχνιδιού..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-3 w-full border border-gray-600 bg-gray-800 text-white rounded-lg text-lg placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
        />
      </div>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      <div className="mt-6 w-full max-w-6xl">
        {/* Skeleton Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="p-4 bg-gray-700 rounded-lg shadow-lg animate-pulse flex flex-col items-center"
              >
                <div className="w-32 h-40 bg-gray-600 rounded-lg"></div>
                <div className="w-3/4 h-4 bg-gray-500 rounded mt-4"></div>
                <div className="w-1/2 h-4 bg-gray-500 rounded mt-2"></div>
              </div>
            ))}
          </div>
        )}

        {/* Μήνυμα αν δεν υπάρχουν παιχνίδια */}
        {!loading && filteredGames.length === 0 && (
          <p className="text-lg text-gray-400 text-center mt-6">Δεν βρέθηκαν παιχνίδια.</p>
        )}

        {/* Εμφάνιση παιχνιδιών */}
        {!loading && filteredGames.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredGames.map((game) => (
              <a
                key={game.id}
                href={`/guide/${encodeURIComponent(game.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}`}
                className="relative p-6 bg-gray-900/90 backdrop-blur-lg rounded-xl shadow-xl transform transition duration-300 hover:scale-105 hover:bg-gray-800/90 flex flex-col items-center border border-gray-700/50 group overflow-hidden"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>

                {/* Game Image */}
                <div className="relative w-36 h-36 flex justify-center items-center">
                  <Image
                    src={game.game_image}
                    alt={game.title}
                    width={144}
                    height={144}
                    className="rounded-lg shadow-md object-contain"
                  />
                </div>

                {/* Game Title */}
                <h2 className="text-xl font-bold text-white text-center mt-4 group-hover:text-blue-400 transition-colors">
                  {game.title}
                </h2>

                {/* Platform */}
                <p className="text-sm text-gray-400">{game.platform}</p>

                {/* Trophy Counts */}
                <div className="flex flex-wrap justify-center items-center gap-2 mt-3 text-sm text-gray-300">
                  <span className="flex items-center gap-1">
                    🏆 <span className="text-yellow-400">{game.trophies.Platinum}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    🥇 <span className="text-orange-400">{game.trophies.Gold}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    🥈 <span className="text-blue-300">{game.trophies.Silver}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    🥉 <span className="text-green-400">{game.trophies.Bronze}</span>
                  </span>
                </div>

                {/* Total Points */}
                <p className="mt-4 text-yellow-300 font-semibold text-lg flex items-center gap-2">
                  ⭐ Σύνολο Πόντων: {game.totalPoints}
                </p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
