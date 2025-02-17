"use client";

import { useState } from "react";
import { Paperclip, Bug } from "lucide-react";
import Image from "next/image";
import Dropdown from "@/app/components/ui/Dropdown";
import FormErrorMessage from "../ui/FormErrorMessage";
import AlertMessage from "../ui/AlertMessage";

export default function BugReportForm() {
  const [form, setForm] = useState({ type: "" }); // Required επιλογή
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [bugDescription, setBugDescription] = useState("");
  const [error, setError] = useState({ type: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const requestTypes = [
    { value: "UI", label: "UI Issue", icon: <Bug className="w-4 h-4 text-white" /> },
    { value: "Crash", label: "Crash", icon: <Bug className="w-4 h-4 text-white" /> },
    {
      value: "Performance",
      label: "Performance Issue",
      icon: <Bug className="w-4 h-4 text-white" />,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setAlert(null);

    const formData = new FormData();
    formData.append("bug_type", form.type);
    formData.append("description", bugDescription);

    if (file) {
      formData.append("screenshot", file);
    }

    try {
      const response = await fetch("/api/contact/forms/bug-report", {
        method: "POST",
        body: formData, // Δεν χρειάζεται headers, το κάνει αυτόματα
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setAlert({ type: "success", message: "✅ Η αναφορά υποβλήθηκε!" });
      setBugDescription("");
      setScreenshotPreview(null);
      setFile(null);
    } catch (err) {
      setAlert({ type: "error", message: "❌ " + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-6">
      {alert && <AlertMessage type={alert.type} message={alert.message} />}

      {/* Dropdown για τύπο προβλήματος */}
      <Dropdown
        label="Τύπος Προβλήματος"
        options={requestTypes}
        selectedValue={form.type}
        onSelect={(value) => setForm({ type: value })}
        isOpen={false}
        zIndex={2}
      />
      <FormErrorMessage message={error.type} />

      {/* Textarea για περιγραφή του bug */}
      <label htmlFor="bugDescription" className="block text-gray-300 text-sm font-medium">
        Περιγραφή του bug <span className="text-red-500">*</span>
      </label>
      <textarea
        id="bugDescription"
        name="bugDescription"
        placeholder="Περιγραφή του bug..."
        rows={4}
        value={bugDescription}
        onChange={(e) => {
          setBugDescription(e.target.value);
          if (error.description) {
            setError((prev) => ({ ...prev, description: undefined }));
          }
        }}
        className={`w-full p-3 bg-gray-800 rounded-lg border ${
          error.description ? "border-red-500" : "border-gray-700"
        } text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
      ></textarea>
      <FormErrorMessage message={error.description} />

      {/* Upload Screenshot */}
      <div className="mt-4">
        <label htmlFor="bugScreenshot" className="block text-sm text-gray-400 mb-2">
          Προσθέστε Screenshot (προαιρετικό)
        </label>
        <div className="flex items-center justify-between">
          <label
            htmlFor="bugScreenshot"
            className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white cursor-pointer flex items-center justify-center space-x-2"
          >
            <Paperclip className="w-5 h-5" />
            <span>Επιλέξτε Αρχείο</span>
          </label>
          <input
            id="bugScreenshot"
            type="file"
            name="bugScreenshot"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setFile(e.target.files[0]);
                setScreenshotPreview(URL.createObjectURL(e.target.files[0]));
              }
            }}
          />
        </div>

        {/* Screenshot Preview */}
        {screenshotPreview && (
          <div className="mt-2">
            <Image
              src={screenshotPreview}
              alt="Screenshot preview"
              width={128}
              height={128}
              className="object-cover rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition flex items-center justify-center space-x-2"
      >
        {loading ? (
          "Υποβολή..."
        ) : (
          <>
            <Bug className="w-5 h-5 text-white" />
            <span>Υποβολή Αναφοράς</span>
          </>
        )}
      </button>
    </form>
  );
}
