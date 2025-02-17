"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import FormErrorMessage from "../ui/FormErrorMessage";

export default function NewGuideForm() {
  const [game, setGame] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!game.trim()) {
      setError("Το όνομα του παιχνιδιού είναι υποχρεωτικό.");
      return;
    }

    setError(""); // Καθαρίζει το error αν όλα είναι εντάξει
    console.log("Form submitted:", { game, message });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <label htmlFor="game" className="block text-gray-300 text-sm">
        Όνομα Παιχνιδιού <span className="text-red-500">*</span>
      </label>
      <input
        id="game"
        type="text"
        name="game"
        placeholder="Γράψτε το όνομα του παιχνιδιού..."
        value={game}
        onChange={(e) => setGame(e.target.value)}
        className={`w-full p-3 bg-gray-800 rounded-lg border ${
          error ? "border-red-500" : "border-gray-700"
        } text-white`}
      />
      <FormErrorMessage message={error} />

      <label htmlFor="message" className="block text-gray-300 text-sm">
        Επιπλέον Σχόλια
      </label>
      <textarea
        id="message"
        name="message"
        placeholder="Προσθέστε περισσότερες λεπτομέρειες αν χρειάζεται..."
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white"
      ></textarea>

      <button
        type="submit"
        className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition flex items-center justify-center space-x-2"
      >
        <Send className="w-5 h-5 text-white" />
        <span>Υποβολή Αιτήματος</span>
      </button>
    </form>
  );
}
