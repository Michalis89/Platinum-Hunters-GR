import { Trophy as LucideTrophy } from 'lucide-react';

export type TrophyType = 'platinum' | 'gold' | 'silver' | 'bronze';

export interface Trophy {
  trophyId: number;
  trophyType: TrophyType;
  trophyName: string;
  trophyDetail: string;
}

interface TrophySidebarProps {
  trophies: Trophy[];
  iconSize?: number;
  classNameIcon?: string;
}

const trophyColors: Record<TrophyType, string> = {
  platinum: 'text-blue-400',
  gold: 'text-yellow-400',
  silver: 'text-gray-400',
  bronze: 'text-orange-500',
};

export function TrophySidebar({ trophies, iconSize, classNameIcon }: Readonly<TrophySidebarProps>) {
  return (
    <aside className="sticky top-20 mt-10 h-[calc(100vh-5rem)] w-full overflow-y-auto rounded bg-gray-900 p-4 text-white shadow-inner md:w-80">
      <h3 className="mb-4 text-lg font-bold">Trophies</h3>
      <ul className="space-y-4">
        {trophies.map(trophy => (
          <li key={trophy.trophyId} className="flex items-start gap-3">
            <LucideTrophy
              className={`${trophyColors[trophy.trophyType]} ${classNameIcon}`}
              strokeWidth={2.5}
              width={iconSize}
              height={iconSize}
            />
            <div>
              <p className="font-semibold leading-tight text-white">{trophy.trophyName}</p>
              <p className="text-sm text-gray-400">{trophy.trophyDetail}</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
