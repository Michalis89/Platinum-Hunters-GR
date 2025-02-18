"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle, Wrench, Info, MessageSquare, Star } from "lucide-react";
import Dropdown from "@/app/components/ui/Dropdown";
import FormErrorMessage from "../ui/FormErrorMessage";
import AlertMessage from "../ui/AlertMessage";

export default function GeneralQuestionForm() {
  const [category, setCategory] = useState("");
  const [question, setQuestion] = useState("");
  const [email, setEmail] = useState("");
  const [serviceName, setServiceName] = useState(""); // Για υποστήριξη
  const [serviceDescription, setServiceDescription] = useState(""); // Για την περιγραφή στην κατηγορία "υποστήριξη"
  const [infoType, setInfoType] = useState(""); // Για πληροφορίες
  const [infoDetails, setInfoDetails] = useState(""); // Για πληροφορίες
  const [feedbackRating, setFeedbackRating] = useState(""); // Για feedback
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [errors, setErrors] = useState<{
    email?: string;
    question?: string;
    serviceName?: string;
    serviceDescription?: string;
    infoType?: string;
    infoDetails?: string;
    feedbackRating?: string;
    guestion?: string;
  }>({});

  const questionCategories = [
    { value: "Support", label: "Υποστήριξη", icon: <Wrench className="w-4 h-4 text-white" /> },
    { value: "Info", label: "Πληροφορίες", icon: <Info className="w-4 h-4 text-white" /> },
    { value: "Feedback", label: "Feedback", icon: <Star className="w-4 h-4 text-white" /> },
    { value: "Other", label: "Άλλο", icon: <MessageSquare className="w-4 h-4 text-white" /> },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setAlert(null);
    setLoading(true);

    // ✅ Έλεγχος required fields
    const newErrors: {
      email?: string;
      question?: string;
      serviceName?: string;
      serviceDescription?: string;
      infoType?: string;
      infoDetails?: string;
      feedbackRating?: string;
      guestion?: string;
    } = {};

    if (!email.trim() || !isValidEmail(email))
      newErrors.email = "Το email είναι υποχρεωτικό και πρέπει να είναι έγκυρο.";

    if (category === "Support" && !serviceName.trim())
      newErrors.serviceName = "Η υπηρεσία είναι υποχρεωτική.";
    if (category === "Support" && !serviceDescription.trim())
      newErrors.serviceDescription = "Η περιγραφή είναι υποχρεωτική.";
    if (category === "Info" && !infoType.trim())
      newErrors.infoType = "Το θέμα πληροφορίας είναι υποχρεωτικός.";
    if (category === "Info" && !infoDetails.trim())
      newErrors.infoDetails = "Η περιγραφή είναι υποχρεωτική.";
    if (category === "Feedback" && !feedbackRating)
      newErrors.feedbackRating = "Επιλέξτε βαθμολογία.";
    if (category === "Other" && !question.trim())
      newErrors.question = "Η ερώτηση είναι υποχρεωτική.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    const formatCategory = (category: string) => {
      const allowedCategories = ["Support", "Info", "Feedback", "Other"];
      return allowedCategories.includes(category) ? category : "";
    };

    console.log("📩 Payload:", {
      category,
      question,
      email,
      serviceName,
      serviceDescription,
      infoType,
      infoDetails,
      feedbackRating,
    });

    try {
      const response = await fetch("/api/contact/forms/general-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: formatCategory(category),
          question,
          email,
          serviceName: category === "Support" ? serviceName : null,
          serviceDescription: category === "Support" ? serviceDescription : null,
          infoType: category === "Info" ? infoType : null,
          infoDetails: category === "Info" ? infoDetails : null,
          feedbackRating: category === "Feedback" ? feedbackRating : null,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setAlert({ type: "success", message: "✅ Η ερώτησή σας υποβλήθηκε επιτυχώς!" });

      setQuestion("");
      setEmail("");
      setServiceName("");
      setServiceDescription("");
      setInfoType("");
      setInfoDetails("");
      setFeedbackRating("");
      setCategory("");
    } catch (err) {
      setAlert({ type: "error", message: "❌ " + err.message });
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // ✅ Καλύτερη regex για email
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {alert && <AlertMessage type={alert.type} message={alert.message} />}

      {/* Dropdown επιλογής */}
      <Dropdown
        label="Κατηγορία Ερώτησης"
        options={questionCategories}
        selectedValue={category}
        onSelect={(value) => setCategory(value)}
        isOpen={false}
        zIndex={2}
      />

      {/* Smooth εμφάνιση των πεδίων όταν υπάρχει επιλογή */}
      {category && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-4"
        >
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
            onChange={(e) => {
              const newEmail = e.target.value.trim();
              setEmail(newEmail);

              if (newEmail === "") {
                setErrors((prev) => ({ ...prev, email: undefined }));
              } else if (!isValidEmail(newEmail)) {
                setErrors((prev) => ({
                  ...prev,
                  email: "Το email πρέπει να είναι έγκυρο (π.χ. user@example.com)",
                }));
              } else {
                setErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            className={`w-full p-3 bg-gray-800 rounded-lg border ${
              errors.email ? "border-red-500" : "border-gray-700"
            } text-white`}
          />
          <FormErrorMessage message={errors.email} />

          {/* Υπηρεσία (για Support) */}
          {category === "Support" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-4"
            >
              <label htmlFor="serviceName" className="block text-gray-300 text-sm font-medium">
                Θέμα Υπηρεσίας <span className="text-red-500">*</span>
              </label>
              <input
                id="serviceName"
                type="text"
                name="serviceName"
                placeholder="Ποια υπηρεσία αντιμετωπίζει πρόβλημα;"
                value={serviceName}
                onChange={(e) => {
                  setServiceName(e.target.value);
                  setErrors((prev) => ({ ...prev, serviceName: undefined }));
                }}
                className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white"
              />
              <FormErrorMessage message={errors.serviceName} />

              <label
                htmlFor="serviceDescription"
                className="block text-gray-300 text-sm font-medium"
              >
                Περιγραφή <span className="text-red-500">*</span>
              </label>
              <textarea
                id="serviceDescription"
                name="serviceDescription"
                placeholder="Δώστε μας μια περιγραφή..."
                rows={4}
                value={serviceDescription}
                onChange={(e) => {
                  setServiceDescription(e.target.value);
                  setErrors((prev) => ({ ...prev, serviceDescription: undefined }));
                }}
                className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white"
              />
              <FormErrorMessage message={errors.serviceDescription} />
            </motion.div>
          )}

          {/* Πληροφορίες (για Info) */}
          {category === "Info" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-4"
            >
              <label htmlFor="infoType" className="block text-gray-300 text-sm font-medium">
                Θέμα Πληροφορίας <span className="text-red-500">*</span>
              </label>
              <input
                id="infoType"
                type="text"
                name="infoType"
                placeholder="Για ποιο θέμα θέλετε πληροφορίες;"
                value={infoType}
                onChange={(e) => {
                  setInfoType(e.target.value);
                  setErrors((prev) => ({ ...prev, infoType: undefined }));
                }}
                className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white"
              />
              <FormErrorMessage message={errors.infoType} />

              <label htmlFor="infoDetails" className="block text-gray-300 text-sm font-medium">
                Περιγραφή <span className="text-red-500">*</span>
              </label>
              <textarea
                id="infoDetails"
                name="infoDetails"
                placeholder="Παρακαλώ δώστε περισσότερες λεπτομέρειες..."
                rows={4}
                value={infoDetails}
                onChange={(e) => {
                  setInfoDetails(e.target.value);
                  setErrors((prev) => ({ ...prev, infoDetails: undefined }));
                }}
                className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white"
              />
              <FormErrorMessage message={errors.infoDetails} />
            </motion.div>
          )}

          {/* Feedback */}
          {category === "Feedback" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-4"
            >
              <label htmlFor="feedbackRating" className="block text-gray-300 text-sm font-medium">
                Βαθμολογία Feedback <span className="text-red-500">*</span>
              </label>
              <select
                id="feedbackRating"
                name="feedbackRating"
                value={feedbackRating}
                onChange={(e) => {
                  setFeedbackRating(e.target.value);
                  setErrors((prev) => ({ ...prev, feedbackRating: undefined }));
                }}
                className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white"
              >
                <option value="">Επιλέξτε βαθμολογία</option>
                <option value="1">⭐ 1 - Πολύ κακό</option>
                <option value="2">⭐⭐ 2 - Μέτριο</option>
                <option value="3">⭐⭐⭐ 3 - Καλό</option>
                <option value="4">⭐⭐⭐⭐ 4 - Πολύ καλό</option>
                <option value="5">⭐⭐⭐⭐⭐ 5 - Εξαιρετικό</option>
              </select>
              <FormErrorMessage message={errors.feedbackRating} />
            </motion.div>
          )}

          {/* Feedback */}
          {category === "Other" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-4"
            >
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
                onChange={(e) => {
                  setQuestion(e.target.value);
                  setErrors((prev) => ({ ...prev, question: undefined }));
                }}
                className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white"
              />
              <FormErrorMessage message={errors.question} />
            </motion.div>
          )}

          <button
            type="submit"
            className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition flex items-center justify-center space-x-2"
          >
            {loading ? (
              "Υποβολή..."
            ) : (
              <>
                <HelpCircle className="w-5 h-5 text-white" />
                <span>Υποβολή Ερώτησης</span>
              </>
            )}
          </button>
        </motion.div>
      )}
    </form>
  );
}
