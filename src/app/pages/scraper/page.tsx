"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ScrapedGameData } from "@/types/interfaces";
import Image from "next/image";

export default function ScraperPage() {
  const [url, setUrl] = useState("");
  const [data, setData] = useState<ScrapedGameData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleScrape = async () => {
    if (!url) return alert("Βάλε ένα έγκυρο URL!");

    setLoading(true);
    setData(null);
    setMessage("");

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (response.status === 409) {
        setMessage(result.message);
        setData(result.existingData);
      } else if (response.ok) {
        setData(result);
      } else {
        setMessage("❌ Σφάλμα κατά το Scraping!");
      }
    } catch (error) {
      console.error("❌ Σφάλμα:", error);
      setMessage("❌ Αποτυχία Scraping! Δοκίμασε ξανά.");
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/save-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.status === 409) {
        setMessage("⚠️ Ο οδηγός υπάρχει ήδη στη βάση!");
      } else if (response.ok) {
        setMessage("✅ Ο οδηγός αποθηκεύτηκε επιτυχώς!");
      } else {
        setMessage("❌ Κάτι πήγε στραβά κατά την αποθήκευση!");
      }
    } catch (error) {
      console.error("❌ Σφάλμα:", error);
      setMessage("❌ Αποτυχία αποθήκευσης στη βάση!");
    }

    setSaving(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 overflow-hidden">
      <motion.div
        className="max-w-2xl w-full text-center flex flex-col items-center gap-3 mt-[-500px]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <h2 className="text-3xl font-bold text-blue-400">🏆 PSN Trophy Guide Scraper</h2>
        <p className="text-gray-400">Βάλε ένα link και δες το guide!</p>

        <div className="flex items-center justify-center gap-2 w-full max-w-lg">
          <Input
            type="text"
            placeholder="Βάλε το URL του guide..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 p-3 bg-gray-800 rounded-lg border border-gray-700 text-white"
          />
          <Button onClick={handleScrape} disabled={loading}>
            {loading ? "⏳ Φόρτωση..." : "Scrape"}
          </Button>
        </div>

        {message && <p className="text-red-500">{message}</p>}

        {data && (
          <Card className="mt-6 p-6 bg-gray-900 rounded-lg">
            {data.gameImage && (
              <div className="relative w-full h-60 mt-4">
                <Image
                  src={data.gameImage}
                  alt={data.title}
                  layout="fill"
                  objectFit="contain"
                  className="rounded-lg"
                />
              </div>
            )}
            <h3 className="text-xl font-semibold text-white">{data.title}</h3>
            <p className="text-sm text-gray-500">{data.platform}</p>
            <Button onClick={handleSave} disabled={saving} className="mt-4">
              {saving ? "💾 Αποθήκευση..." : "💾 Αποθήκευση στη βάση"}
            </Button>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
