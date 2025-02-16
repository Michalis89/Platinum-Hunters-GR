"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { motion } from "framer-motion";

export default function EditGuide() {
  const { id } = useParams(); // Παίρνουμε το ID από το URL
  const [steps, setSteps] = useState<{ title: string; description: string }[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔹 Φόρτωσε τον οδηγό όταν ανοίξει η σελίδα
  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const response = await fetch(`/api/guides/${id}`);
        const data = await response.json();
        if (response.ok && data) {
          console.log("📥 Guide Data:", data); // Debugging
          setSteps(data[0]?.steps ?? []);
        } else {
          setMessage("❌ Σφάλμα φόρτωσης οδηγού!");
        }
      } catch (error) {
        console.error("❌ Σφάλμα:", error);
        setMessage("❌ Αποτυχία φόρτωσης!");
      }
      setLoading(false);
    };

    if (id) fetchGuide();
  }, [id]);

  // 🔹 Χειρισμός αλλαγής στο textarea
  const handleChange = (index: number, newText: string) => {
    setSteps((prevSteps) =>
      prevSteps.map((step, i) => (i === index ? { ...step, description: newText } : step))
    );
  };

  // 🔹 Αποθήκευση των αλλαγών στη βάση
  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    console.log("📤 Sending steps:", steps); // Debugging

    try {
      const response = await fetch(`/api/update-guide/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps }),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage("✅ Ο οδηγός ενημερώθηκε επιτυχώς!");
      } else {
        setMessage(result.error || "❌ Σφάλμα κατά την ενημέρωση!");
      }
    } catch (error) {
      console.error("❌ Σφάλμα:", error);
      setMessage("❌ Σφάλμα κατά την αποθήκευση!");
    }

    setSaving(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      <motion.div
        className="max-w-3xl w-full"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <h2 className="text-3xl font-bold text-blue-400 text-center">✍️ Επεξεργασία Οδηγού</h2>

        {loading ? (
          <p className="text-center text-gray-400">🔄 Φόρτωση...</p>
        ) : (
          <div className="mt-6 space-y-4">
            {steps.map((step, index) => (
              <Card
                key={index}
                className="p-6 bg-gray-900 rounded-lg shadow-lg border border-gray-800"
              >
                <h3 className="text-lg font-bold text-blue-300">{step.title}</h3>
                <textarea
                  className="w-full mt-3 p-4 bg-gray-800 rounded-lg border border-gray-700 text-white min-h-[150px] resize-none focus:ring-2 focus:ring-blue-500"
                  value={step.description}
                  onChange={(e) => handleChange(index, e.target.value)}
                />
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "💾 Αποθήκευση..." : "💾 Αποθήκευση"}
          </Button>
        </div>

        {message && <p className="mt-4 text-center text-gray-300">{message}</p>}
      </motion.div>
    </div>
  );
}
