"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Guide, ApiGame } from "@/types/interfaces";

export default function GameDetails() {
  const { slug } = useParams();
  const [game, setGame] = useState<ApiGame | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameAndGuides = async () => {
      try {
        // 1️⃣ Παίρνουμε όλα τα παιχνίδια και βρίσκουμε το ID με βάση το slug
        const gameResponse = await fetch("/api/games");
        if (!gameResponse.ok) throw new Error("Failed to fetch games");

        const gamesData: ApiGame[] = await gameResponse.json();
        const matchedGame = gamesData.find(
          (game) =>
            encodeURIComponent(game.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")) === slug
        );

        if (!matchedGame) {
          throw new Error("Game not found");
        }

        setGame(matchedGame);

        // 2️⃣ Φέρνουμε το αντίστοιχο guide
        const guideResponse = await fetch(`/api/guides/${matchedGame.id}`);
        if (!guideResponse.ok) throw new Error("Failed to fetch guide data");

        const guideData: Guide[] = await guideResponse.json();
        setGuides(guideData);
      } catch (err) {
        console.error("❌ Σφάλμα στη φόρτωση:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGameAndGuides();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
        {/* Skeleton Loader για το παιχνίδι */}
        <div className="max-w-3xl w-full bg-gray-900 p-6 rounded-lg shadow-lg animate-pulse">
          <div className="flex justify-center mb-4">
            <div className="w-48 h-48 bg-gray-700 rounded-lg"></div>
          </div>
          <div className="h-6 bg-gray-700 w-3/4 mx-auto rounded"></div>
          <div className="h-4 bg-gray-700 w-1/2 mx-auto rounded mt-2"></div>
        </div>

        {/* Skeleton Loader για τα trophy guides */}
        <div className="w-full max-w-3xl mt-6">
          {Array(2)
            .fill(null)
            .map((_, index) => (
              <div key={index} className="bg-gray-800 p-6 rounded-lg shadow-md mb-6 animate-pulse">
                <div className="h-6 bg-gray-700 w-1/2 rounded"></div>
                <div className="h-4 bg-gray-700 w-full rounded mt-3"></div>
                <div className="h-4 bg-gray-700 w-3/4 rounded mt-2"></div>
                <div className="h-4 bg-gray-700 w-2/4 rounded mt-2"></div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      {game && (
        <div className="max-w-3xl w-full bg-gray-900 p-6 rounded-lg shadow-lg">
          {/* 🖼️ Εικόνα Παιχνιδιού */}
          <div className="flex justify-center mb-4">
            <Image
              src={game.game_image || "/default-image.png"}
              alt={game.title}
              width={200}
              height={200}
              className="rounded-lg shadow-md object-contain"
            />
          </div>

          {/* 🎮 Τίτλος Παιχνιδιού */}
          <h1 className="text-3xl font-extrabold text-blue-400 text-center">{game.title}</h1>
          <p className="text-lg text-gray-400 text-center">{game.platform}</p>

          {/* 📊 Στατιστικά Guide */}
          {guides.length > 0 && (
            <div className="flex justify-center mt-4 gap-4 text-lg">
              <span className="text-yellow-400">🔥 Δυσκολία: {guides[0].difficulty}</span>
              <span className="text-orange-400">🎮 Playthroughs: {guides[0].playthroughs}</span>
              <span className="text-blue-300">⏳ Ώρες: {guides[0].hours}</span>
            </div>
          )}

          {/* ✏️ Κουμπί Επεξεργασίας Guide */}
          <div className="text-center mt-6">
            <Link
              href={`/edit-guide/${game.id}`}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg text-lg transition"
            >
              ✏️ Επεξεργασία Guide
            </Link>
          </div>
        </div>
      )}

      {/* 📜 Trophy Guides */}
      {guides.length > 0 ? (
        <div className="w-full max-w-3xl mt-6">
          {guides.map((guide) => (
            <div key={guide.id} className="bg-gray-800 p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-2xl font-bold text-yellow-400 text-center">📜 Trophy Guide</h2>
              {guide.steps.map((step, index) => (
                <div key={index} className="mt-6">
                  <h3 className="text-xl font-semibold text-blue-300">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>

                  {step.trophies.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {step.trophies.map((trophy, i) => {
                        let trophyIcon = "🥉"; // Default bronze
                        if (trophy.type === "Platinum") trophyIcon = "🏆";
                        else if (trophy.type === "Gold") trophyIcon = "🥇";
                        else if (trophy.type === "Silver") trophyIcon = "🥈";

                        return (
                          <li key={i} className="text-gray-300">
                            {trophyIcon} <span className="text-white">{trophy.name}</span> -{" "}
                            {trophy.description}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-lg text-gray-400 text-center mt-6">
          ❌ Δεν υπάρχουν guides για αυτό το παιχνίδι.
        </p>
      )}
    </div>
  );
}
