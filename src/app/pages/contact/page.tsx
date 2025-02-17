"use client";

import { useState, useEffect } from "react";
import { Mail, Bug, Lightbulb, HelpCircle, BookOpen } from "lucide-react";
import Skeleton from "@/app/components/ui/Skeleton";
import NewGuideForm from "@/app/components/contact/NewGuideForm";
import BugReportForm from "@/app/components/contact/BugReportForm";
import FeatureRequestForm from "@/app/components/contact/FeatureRequestForm";
import GeneralQuestionForm from "@/app/components/contact/GeneralQuestionForm";
import SupportForm from "@/app/components/contact/SupportForm";
import Dropdown from "@/app/components/ui/Dropdown";

const requestTypes = [
  {
    value: "new_guide",
    label: "Νέος οδηγός Trophy",
    icon: <BookOpen size={16} className="inline-block mr-2" />,
  },
  {
    value: "bug_report",
    label: "Αναφορά Bug",
    icon: <Bug size={16} className="inline-block mr-2" />,
  },
  {
    value: "feature_request",
    label: "Αίτημα νέου feature",
    icon: <Lightbulb size={16} className="inline-block mr-2" />,
  },
  {
    value: "general_question",
    label: "Γενική ερώτηση",
    icon: <HelpCircle size={16} className="inline-block mr-2" />,
  },
  {
    value: "support",
    label: "Υποστήριξη / Δωρεά",
    icon: <Mail size={16} className="inline-block mr-2" />,
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ type: "new_guide" });
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsPageLoading(false), 1000);
  }, []);

  if (isPageLoading) {
    return <Skeleton type="page" />;
  }

  const renderFormComponent = () => {
    switch (form.type) {
      case "new_guide":
        return <NewGuideForm />;
      case "bug_report":
        return <BugReportForm />;
      case "feature_request":
        return <FeatureRequestForm />;
      case "general_question":
        return <GeneralQuestionForm />;
      case "support":
        return <SupportForm />;
      default:
        return null;
    }
  };

  const requestMessages: { [key: string]: string } = {
    new_guide: "Στείλε αίτημα για νέο Trophy Guide",
    bug_report: "Αναφορά προβλήματος που εντοπίσατε",
    feature_request: "Πρότεινε ένα νέο feature για το project",
    general_question: "Ρώτησε μας ό,τι θέλεις!",
    support: "Υποστήριξε το project μέσω δωρεάς",
    other: "Στείλε μας το μήνυμά σου",
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-lg w-full bg-gray-900 p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-extrabold text-blue-400 text-center flex items-center justify-center gap-2">
          <Mail size={24} /> Επικοινωνία
        </h1>
        <p className="text-gray-400 text-center">
          {requestMessages[form.type] || "Στείλε μας το μήνυμά σου"}
        </p>

        <div className="mt-6">
          <Dropdown
            label="Επιλέξτε θέμα επικοινωνίας"
            options={requestTypes}
            selectedValue={form.type}
            onSelect={(value) => setForm({ type: value })}
            isOpen={false}
            zIndex={2}
          />
        </div>

        {renderFormComponent()}
      </div>
    </div>
  );
}
