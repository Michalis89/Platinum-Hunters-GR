import Badge from '@/app/components/ui/Badge';

interface GuideStatsProps {
  readonly difficulty: string;
  readonly difficultyColor: string;
  readonly playthroughs: number;
  readonly playthroughsColor: string;
  readonly hours: number;
  readonly hoursColor: string;
}

export default function GuideStats({
  difficulty,
  difficultyColor,
  playthroughs,
  playthroughsColor,
  hours,
  hoursColor,
}: GuideStatsProps) {
  return (
    <div className="mt-4 flex justify-center gap-4 text-lg">
      <Badge text={`${difficulty} Difficulty`} color={difficultyColor} />
      <Badge
        text={`${playthroughs} ${playthroughs === 1 ? 'Playthrough' : 'Playthroughs'}`}
        color={playthroughsColor}
      />
      <Badge text={`${hours} Hours`} color={hoursColor} />
    </div>
  );
}
