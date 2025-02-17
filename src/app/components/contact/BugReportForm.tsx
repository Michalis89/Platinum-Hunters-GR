import { Paperclip, Bug } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import Dropdown from "@/app/components/ui/Dropdown"; // Προσθήκη του Dropdown
import FormErrorMessage from "../ui/FormErrorMessage";

export default function BugReportForm() {
  const [form, setForm] = useState({ type: "bug_report" });
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [bugDescription, setBugDescription] = useState(""); // State για το input
  const [error, setError] = useState(""); // Error state

  const requestTypes = [
    { value: "UI", label: "UI Issue", icon: <Bug className="w-4 h-4 text-white" /> },
    { value: "Crash", label: "Crash", icon: <Bug className="w-4 h-4 text-white" /> },
    {
      value: "Performance",
      label: "Performance Issue",
      icon: <Bug className="w-4 h-4 text-white" />,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!bugDescription.trim()) {
      setError("Η περιγραφή του bug είναι υποχρεωτική.");
      return;
    }

    setError(""); // Clear error if valid
    console.log("Bug Report Submitted:", { type: form.type, description: bugDescription });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-6">
      {/* Dropdown για τύπο προβλήματος */}
      <Dropdown
        label="Τύπος Προβλήματος"
        options={requestTypes}
        selectedValue={form.type}
        isOpen={false}
        onSelect={(value) => setForm({ type: value })}
        zIndex={2}
      />

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
        onChange={(e) => setBugDescription(e.target.value)}
        className={`w-full p-3 bg-gray-800 rounded-lg border ${
          error ? "border-red-500" : "border-gray-700"
        } text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
      ></textarea>
      <FormErrorMessage message={error} />

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
            onChange={(e) => setScreenshotPreview(URL.createObjectURL(e.target.files[0]))}
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
        className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition flex items-center justify-center space-x-2"
      >
        <Bug className="w-5 h-5 text-white" />
        <span>Υποβολή Αναφοράς</span>
      </button>
    </form>
  );
}
