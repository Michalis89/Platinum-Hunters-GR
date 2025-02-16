import { GuideProps, Trophy } from "@/types/interfaces";
import { Trophy as TrophyIcon, BookOpen } from "lucide-react";
import { motion } from "framer-motion"; // Animation library

interface TrophyGuidesProps {
  readonly guides: GuideProps[];
}

export default function TrophyGuides({ guides }: TrophyGuidesProps) {
  const trophyColors: Record<Trophy["type"], string> = {
    Platinum: "text-blue-400", // Μπλε για το Platinum
    Gold: "text-yellow-400", // Χρυσό για το Gold
    Silver: "text-gray-400", // Ασημί για το Silver
    Bronze: "text-orange-500", // Πορτοκαλί για το Bronze
    Unknown: "text-red-500", // Κόκκινο για άγνωστα
  };

  return (
    <div className="w-full max-w-4xl mt-6">
      {guides.length > 0 ? (
        guides.map((guide) => (
          <div key={guide.id} className="bg-gray-800 p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-bold text-yellow-400 text-center flex items-center justify-center gap-2">
              <BookOpen className="w-8 h-8 text-yellow-400" />
              <span>Trophy Guides</span>
            </h2>

            {guide.steps.map((step, index) => (
              <div key={index} className="mt-6">
                <h3 className="text-xl font-semibold text-blue-300">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>

                {step.trophies.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {step.trophies.map((trophy, i) => (
                      <motion.div
                        key={i}
                        className="flex items-center bg-gray-700 p-3 rounded-lg shadow-md transition-transform duration-200 ease-in-out hover:scale-105"
                        initial={{ opacity: 0, y: 10 }} // Fade-in + slide-up
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.1 }}
                      >
                        <TrophyIcon className={`w-10 h-10 mr-3 ${trophyColors[trophy.type]}`} />
                        <div>
                          <p className="text-white font-semibold">{trophy.name}</p>
                          <p className="text-gray-400 text-sm">{trophy.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))
      ) : (
        <p className="text-lg text-gray-400 text-center mt-6">
          ❌ Δεν υπάρχουν guides για αυτό το παιχνίδι.
        </p>
      )}
    </div>
  );
}
