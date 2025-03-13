import { getVersion } from '@/utils/getVersion';

export default function VersionBadge() {
  const version = getVersion();

  return (
    <div className="fixed bottom-4 right-4 text-xs text-gray-500 opacity-80 transition-opacity hover:opacity-100">
      Version: {version}
    </div>
  );
}
