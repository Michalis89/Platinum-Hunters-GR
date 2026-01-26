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
    <div className="mt-4 flex flex-wrap justify-center gap-2 text-base md:gap-4 md:text-lg">
      <Badge text={`${difficulty} Δυσκολία`} color={difficultyColor} />
      <Badge
        text={`${playthroughs} ${playthroughs === 1 ? 'Run' : 'Runs'}`}
        color={playthroughsColor}
      />
      <Badge text={`${hours} Ώρες`} color={hoursColor} />
    </div>
  );
}
