import type { ReactNode } from 'react';
import AdminSupportShell from './_components/AdminSupportShell.client';

export default function AdminSupportLayout({ children }: { children: ReactNode }) {
  return <AdminSupportShell>{children}</AdminSupportShell>;
}
