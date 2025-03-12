import { GuideProps, Trophy } from '@/types/interfaces';
import { Trophy as TrophyIcon, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface TrophyGuidesProps {
  readonly guides: GuideProps[];
}

export default function TrophyGuides({ guides }: TrophyGuidesProps) {
  const trophyColors: Record<Trophy['type'], string> = {
    Platinum: 'text-blue-400',
    Gold: 'text-yellow-400',
    Silver: 'text-gray-400',
    Bronze: 'text-orange-500',
    Unknown: 'text-red-500',
  };

  return (
    <div className="mt-6 w-full max-w-4xl">
      {guides.length > 0 ? (
        guides.map(guide => (
          <div key={guide.id} className="mb-6 rounded-lg bg-gray-800 p-6 shadow-md">
            <h2 className="flex items-center justify-center gap-2 text-center text-2xl font-bold text-yellow-400">
              <BookOpen className="h-8 w-8 text-yellow-400" />
              <span>Trophy Guides</span>
            </h2>

            {guide.steps.map((step, index) => (
              <div key={index} className="mt-6">
                <h3 className="text-xl font-semibold text-blue-300">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>

                {step.trophies.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {step.trophies.map((trophy, i) => (
                      <motion.div
                        key={i}
                        className="flex items-center rounded-lg bg-gray-700 p-3 shadow-md transition-transform duration-200 ease-in-out hover:scale-105"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.1 }}
                      >
                        <TrophyIcon className={`mr-3 h-10 w-10 ${trophyColors[trophy.type]}`} />
                        <div>
                          <p className="font-semibold text-white">{trophy.name}</p>
                          <p className="text-sm text-gray-400">{trophy.description}</p>
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
        <p className="mt-6 text-center text-lg text-gray-400">
          ❌ Δεν υπάρχουν guides για αυτό το παιχνίδι.
        </p>
      )}
    </div>
  );
}
