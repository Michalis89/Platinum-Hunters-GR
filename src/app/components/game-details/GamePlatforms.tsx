import { Gamepad2 } from "lucide-react";

interface GamePlatformsProps {
  readonly platforms?: string[] | null;
}

export default function GamePlatforms({ platforms }: GamePlatformsProps) {
  if (!platforms || platforms.length === 0) return null;

  return (
    <div className="mt-4 text-center text-gray-300 border-t border-gray-700 pt-3">
      <p className="flex items-center justify-center">
        <Gamepad2 className="w-4 h-4 mr-2 text-blue-400" />
        <span className="font-semibold">Platforms:</span>
        <span className="ml-2 text-white text-sm">{platforms.join(", ")}</span>
      </p>
    </div>
  );
}
