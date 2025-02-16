"use client";

import { useEffect, useState } from "react";
import { Game, ApiGame } from "@/types/interfaces";
import SearchBar from "@/app/components/guides/SearchBar";
import AlertMessage from "@/app/components/ui/AlertMessage";
import GameGrid from "@/app/components/guides/GameGrid";
import { BookOpen } from "lucide-react";
import Skeleton from "@/app/components/ui/Skeleton";

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

  const content = () => {
    if (loading) {
      return <Skeleton type="grid" />;
    }
    if (filteredGames.length > 0) return <GameGrid games={filteredGames} />;
    return <p className="text-lg text-gray-400 text-center mt-6">Δεν βρέθηκαν παιχνίδια.</p>;
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <h1 className="text-5xl font-extrabold text-blue-400 mb-6 flex items-center gap-3">
        <BookOpen className="w-12 h-12 text-yellow-400 relative top-1" />
        <span>Trophy Guides</span>
      </h1>

      <SearchBar search={search} setSearch={setSearch} />

      {error && <AlertMessage type="error" message={error} />}

      <div className="mt-6 w-full max-w-6xl">{content()}</div>
    </div>
  );
}
