import { Gamepad2 } from 'lucide-react';

interface GamePlatformsProps {
  readonly platforms?: string[] | null;
}

export default function GamePlatforms({ platforms }: GamePlatformsProps) {
  if (!platforms || platforms.length === 0) return null;

  return (
    <div className="mt-4 border-t border-gray-700 pt-3 text-center text-gray-300">
      <p className="flex items-center justify-center">
        <Gamepad2 className="mr-2 h-4 w-4 text-blue-400" />
        <span className="font-semibold">Platforms:</span>
        <span className="ml-2 text-sm text-white">{platforms.join(', ')}</span>
      </p>
    </div>
  );
}
