import { GuideProps, Trophy } from '@/types/interfaces';
import { Trophy as TrophyIcon, BookOpen } from 'lucide-react';
import type { ReactNode } from 'react';

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
    <div className="mt-2 w-full">
      {guides.length > 0 ? (
        guides.map(guide => (
          <div
            key={guide.id}
            className="mb-6 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/85 via-slate-900/70 to-slate-950/85 p-5 shadow-lg shadow-slate-950/40"
          >
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-amber-300">
              <BookOpen className="h-6 w-6 text-amber-300" />
              <span>Οδηγός</span>
            </div>

            {guide.steps && guide.steps.length > 0 ? (
              guide.steps.map((step, index) => (
                <div
                  key={index}
                  className="mt-6 rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 shadow-inner shadow-slate-900/30"
                >
                  <h3 className="mb-2 text-lg font-semibold text-sky-200">{step.title}</h3>
                  <div className="prose prose-invert max-w-none prose-p:my-3 prose-ul:my-2 prose-ol:my-2 text-slate-200">
                    {renderStepContent(step.content_rich, step.content_html, step.description)}
                  </div>

                  {step.trophies && step.trophies.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {step.trophies.map((trophy, i) => (
                        <div
                          key={i}
                          className="flex items-center rounded-lg border border-slate-800/80 bg-slate-900 p-3 shadow"
                        >
                          <TrophyIcon className={`mr-3 h-10 w-10 ${trophyColors[trophy.type]}`} />
                          <div>
                            <p className="font-semibold text-white">{trophy.name}</p>
                            <p className="text-sm text-slate-400">{trophy.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="mt-4 text-center text-gray-400">
                Δεν υπάρχουν βήματα για αυτόν τον οδηγό.
              </p>
            )}
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

function renderStepContent(
  contentRich: unknown,
  contentHtml: string | null | undefined,
  fallbackDescription: string | undefined,
): ReactNode {
  if (contentHtml) {
    return <div dangerouslySetInnerHTML={{ __html: contentHtml }} />;
  }

  if (Array.isArray((contentRich as { content?: unknown[] })?.content)) {
    const blocks = (contentRich as { content: Array<{ type?: string; text?: string }> }).content;
    return blocks.map((block, idx) => (
      <p key={idx} className="leading-7 text-gray-300">
        {block?.text ?? ''}
      </p>
    ));
  }

  return <p className="whitespace-pre-wrap text-gray-300">{fallbackDescription}</p>;
}
