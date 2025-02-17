"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";
import FormErrorMessage from "../ui/FormErrorMessage";

export default function FeatureRequestForm() {
  const [featureTitle, setFeatureTitle] = useState("");
  const [featureDescription, setFeatureDescription] = useState("");
  const [featureReason, setFeatureReason] = useState(""); // Required
  const [featureExample, setFeatureExample] = useState("");
  const [priority, setPriority] = useState("medium");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!featureTitle.trim()) {
      setError("Ο τίτλος του feature είναι υποχρεωτικός.");
      return;
    }

    if (!featureDescription.trim()) {
      setError("Η περιγραφή της ιδέας είναι υποχρεωτική.");
      return;
    }

    if (!featureReason.trim()) {
      setError("Πρέπει να εξηγήσετε γιατί αυτό το feature είναι χρήσιμο.");
      return;
    }

    if (featureExample && !isValidURL(featureExample)) {
      setError("Το παράδειγμα πρέπει να είναι ένα έγκυρο URL.");
      return;
    }

    setError(""); // Clear error if all is good
    console.log("Feature Request Submitted:", {
      title: featureTitle,
      description: featureDescription,
      reason: featureReason,
      example: featureExample,
      priority,
    });
  };

  const isValidURL = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {/* Τίτλος Feature */}
      <label htmlFor="featureTitle" className="block text-gray-300 text-sm font-medium">
        Τίτλος Feature <span className="text-red-500">*</span>
      </label>
      <input
        id="featureTitle"
        type="text"
        name="featureTitle"
        placeholder="Γράψτε έναν σύντομο τίτλο..."
        value={featureTitle}
        onChange={(e) => setFeatureTitle(e.target.value)}
        className={`w-full p-3 bg-gray-800 rounded-lg border ${
          error ? "border-red-500" : "border-gray-700"
        } text-white`}
      />

      {/* Περιγραφή Feature */}
      <label htmlFor="featureDescription" className="block text-gray-300 text-sm font-medium">
        Περιγραφή της ιδέας <span className="text-red-500">*</span>
      </label>
      <textarea
        id="featureDescription"
        name="featureDescription"
        placeholder="Περιγράψτε το feature..."
        rows={4}
        value={featureDescription}
        onChange={(e) => setFeatureDescription(e.target.value)}
        className={`w-full p-3 bg-gray-800 rounded-lg border ${
          error ? "border-red-500" : "border-gray-700"
        } text-white`}
      />

      {/* Σκοπός του Feature (Required) */}
      <label htmlFor="featureReason" className="block text-gray-300 text-sm font-medium">
        Γιατί είναι χρήσιμο αυτό το feature; <span className="text-red-500">*</span>
      </label>
      <textarea
        id="featureReason"
        name="featureReason"
        placeholder="Εξηγήστε τη σημασία του feature..."
        rows={3}
        value={featureReason}
        onChange={(e) => setFeatureReason(e.target.value)}
        className={`w-full p-3 bg-gray-800 rounded-lg border ${
          error ? "border-red-500" : "border-gray-700"
        } text-white`}
      />
      <FormErrorMessage message={error} />

      {/* Παράδειγμα URL */}
      <label htmlFor="featureExample" className="block text-gray-300 text-sm font-medium">
        Παράδειγμα από άλλο site (προαιρετικό)
      </label>
      <input
        id="featureExample"
        type="text"
        name="featureExample"
        placeholder="Εισάγετε ένα URL (προαιρετικό)"
        value={featureExample}
        onChange={(e) => setFeatureExample(e.target.value)}
        className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white"
      />

      {/* Επιλογή Προτεραιότητας */}
      <label htmlFor="priority" className="block text-gray-300 text-sm font-medium">
        Προτεραιότητα Feature
      </label>
      <div className="flex space-x-4">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="priority"
            value="low"
            checked={priority === "low"}
            onChange={() => setPriority("low")}
            className="form-radio text-blue-500"
          />
          <span className="text-gray-300">Χαμηλή</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="priority"
            value="medium"
            checked={priority === "medium"}
            onChange={() => setPriority("medium")}
            className="form-radio text-blue-500"
          />
          <span className="text-gray-300">Μεσαία</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="priority"
            value="high"
            checked={priority === "high"}
            onChange={() => setPriority("high")}
            className="form-radio text-blue-500"
          />
          <span className="text-gray-300">Υψηλή</span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition flex items-center justify-center space-x-2"
      >
        <Lightbulb className="w-5 h-5 text-white" />
        <span>Υποβολή Αιτήματος</span>
      </button>
    </form>
  );
}
