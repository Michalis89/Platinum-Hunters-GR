import AppShell from '@/app/components/AppShell';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
