import { getVersion } from '@/utils/getVersion';

export default function VersionBadge() {
  const version = getVersion();

  return <>: {version}</>;
}
