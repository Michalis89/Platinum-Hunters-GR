"use client";

import { useState } from "react";
import { HelpCircle, Wrench, Info, MessageSquare, Star } from "lucide-react";
import Dropdown from "@/app/components/ui/Dropdown";
import FormErrorMessage from "../ui/FormErrorMessage";

export default function GeneralQuestionForm() {
  const [category, setCategory] = useState("support");
  const [question, setQuestion] = useState("");
  const [email, setEmail] = useState("");
  const [serviceName, setServiceName] = useState(""); // Για υποστήριξη
  const [infoType, setInfoType] = useState(""); // Για πληροφορίες
  const [feedbackRating, setFeedbackRating] = useState(""); // Για feedback
  const [error, setError] = useState("");

  const questionCategories = [
    { value: "support", label: "Υποστήριξη", icon: <Wrench className="w-4 h-4 text-white" /> },
    { value: "info", label: "Πληροφορίες", icon: <Info className="w-4 h-4 text-white" /> },
    { value: "feedback", label: "Feedback", icon: <Star className="w-4 h-4 text-white" /> },
    { value: "other", label: "Άλλο", icon: <MessageSquare className="w-4 h-4 text-white" /> },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !isValidEmail(email)) {
      setError("Το email είναι υποχρεωτικό και πρέπει να είναι έγκυρο.");
      return;
    }

    if (category === "support" && !serviceName.trim()) {
      setError("Η υπηρεσία που αντιμετωπίζει πρόβλημα είναι υποχρεωτική.");
      return;
    }

    if (category === "info" && !infoType.trim()) {
      setError("Ο τύπος πληροφορίας είναι υποχρεωτικός.");
      return;
    }

    if (category === "feedback" && !feedbackRating) {
      setError("Επιλέξτε βαθμολογία για το feedback.");
      return;
    }

    if (!question.trim()) {
      setError("Η ερώτηση είναι υποχρεωτική.");
      return;
    }

    setError(""); // Καθαρίζει το error αν όλα είναι σωστά
    console.log("Submitted:", { category, question, email, serviceName, infoType, feedbackRating });
  };

  const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <Dropdown
        label="Κατηγορία Ερώτησης"
        options={questionCategories}
        selectedValue={category}
        onSelect={(value) => setCategory(value)}
        isOpen={false}
        zIndex={2}
      />

      {/* Email */}
      <label htmlFor="email" className="block text-gray-300 text-sm font-medium">
        Το email σας <span className="text-red-500">*</span>
      </label>
      <input
        id="email"
        type="email"
        name="email"
        placeholder="example@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={`w-full p-3 bg-gray-800 rounded-lg border ${
          error && !email.trim() ? "border-red-500" : "border-gray-700"
        } text-white`}
      />
      <FormErrorMessage message={!email.trim() ? error : ""} />

      {/* Ανάλογα με την επιλογή, εμφανίζουμε διαφορετικά πεδία */}
      {category === "support" && (
        <>
          <label htmlFor="serviceName" className="block text-gray-300 text-sm font-medium">
            Ονομασία Υπηρεσίας <span className="text-red-500">*</span>
          </label>
          <input
            id="serviceName"
            type="text"
            name="serviceName"
            placeholder="Ποια υπηρεσία αντιμετωπίζει πρόβλημα;"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white"
          />
          <FormErrorMessage message={!serviceName.trim() ? error : ""} />
        </>
      )}

      {category === "info" && (
        <>
          <label htmlFor="infoType" className="block text-gray-300 text-sm font-medium">
            Τύπος Πληροφορίας <span className="text-red-500">*</span>
          </label>
          <input
            id="infoType"
            type="text"
            name="infoType"
            placeholder="Για ποιο θέμα θέλετε πληροφορίες;"
            value={infoType}
            onChange={(e) => setInfoType(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white"
          />
          <FormErrorMessage message={!infoType.trim() ? error : ""} />
        </>
      )}

      {category === "feedback" && (
        <>
          <label htmlFor="feedbackRating" className="block text-gray-300 text-sm font-medium">
            Βαθμολογία Feedback <span className="text-red-500">*</span>
          </label>
          <select
            id="feedbackRating"
            name="feedbackRating"
            value={feedbackRating}
            onChange={(e) => setFeedbackRating(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white"
          >
            <option value="">Επιλέξτε βαθμολογία</option>
            <option value="1">⭐ 1 - Πολύ κακό</option>
            <option value="2">⭐⭐ 2 - Μέτριο</option>
            <option value="3">⭐⭐⭐ 3 - Καλό</option>
            <option value="4">⭐⭐⭐⭐ 4 - Πολύ καλό</option>
            <option value="5">⭐⭐⭐⭐⭐ 5 - Εξαιρετικό</option>
          </select>
          <FormErrorMessage message={!feedbackRating ? error : ""} />
        </>
      )}

      {/* Ερώτηση */}
      <label htmlFor="question" className="block text-gray-300 text-sm font-medium">
        Η ερώτησή σας <span className="text-red-500">*</span>
      </label>
      <textarea
        id="question"
        name="question"
        placeholder="Γράψτε την ερώτησή σας..."
        rows={4}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white"
      />
      <FormErrorMessage message={!question.trim() ? error : ""} />

      <button
        type="submit"
        className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition flex items-center justify-center space-x-2"
      >
        <HelpCircle className="w-5 h-5 text-white" />
        <span>Υποβολή Ερώτησης</span>
      </button>
    </form>
  );
}
