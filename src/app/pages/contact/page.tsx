"use client";

import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setResponse(data.message);
    setLoading(false);

    if (res.ok) setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-lg w-full bg-gray-900 p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-extrabold text-blue-400 text-center">📧 Επικοινωνία</h1>
        <p className="text-gray-400 text-center">Στείλε αίτημα για νέο Trophy Guide</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Όνομα"
            required
            value={form.name}
            onChange={handleChange}
            className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white"
          />

          <textarea
            name="message"
            placeholder="Μήνυμά σου..."
            required
            rows={4}
            value={form.message}
            onChange={handleChange}
            className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition"
          >
            {loading ? "⏳ Αποστολή..." : "📨 Στείλε Μήνυμα"}
          </button>
        </form>

        {response && <p className="mt-4 text-center text-gray-300">{response}</p>}
      </div>
    </div>
  );
}
