'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const OfflineBanner = dynamic(() => import('./OfflineBanner'), { ssr: false });
const SWUpdateBanner = dynamic(() => import('./SWUpdateBanner'), { ssr: false });
const IOSInstallHint = dynamic(() => import('./IOSInstallHint'), { ssr: false });
const InstallPrompt = dynamic(() => import('./InstallPrompt'), { ssr: false });
const OnlineReconnectToast = dynamic(() => import('./OnlineReconnectToast'), { ssr: false });
const PushOptInPrompt = dynamic(() => import('./PushOptInPrompt'), { ssr: false });
const PeriodicFeedSync = dynamic(() => import('./PeriodicFeedSync'), { ssr: false });

export default function AppRuntimeEnhancements() {
  const pathname = usePathname() ?? '';
  const isAuthRoute = pathname.startsWith('/auth/');

  if (isAuthRoute) {
    return null;
  }

  return (
    <>
      <OfflineBanner />
      <SWUpdateBanner />
      <InstallPrompt />
      <IOSInstallHint />
      <PushOptInPrompt />
      <PeriodicFeedSync />
      <OnlineReconnectToast />
    </>
  );
}
