'use client';

import { GridList } from '@/app/components/layout/GridList';
import { PageWrapper } from '@/app/components/layout/PageWrapper';
import { SidebarLayout } from '@/app/components/layout/SidebarLayout';
import { Button, ButtonVariant } from '@/app/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/Card';
import { Modal } from '@/app/components/ui/Modal';
import Skeleton from '@/app/components/ui/Skeleton';
import { useState } from 'react';

export default function UIKitPage() {
  const [openModal, setOpenModal] = useState(false);

  if (process.env.NODE_ENV !== 'development') return null;
  const variants: ButtonVariant[] = [
    'primary',
    'secondary',
    'tertiary',
    'danger',
    'success',
    'warning',
  ];

  return (
    <div className="space-y-12 p-6">
      <section>
        <h2 className="mb-4 text-xl font-bold">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          {variants.map(v => (
            <Button key={v} variant={v}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-bold">Layout Examples</h2>

        <div className="space-y-8">
          <PageWrapper className="rounded bg-gray-900">
            <div className="text-white">Αυτό είναι μέσα σε PageWrapper</div>
          </PageWrapper>

          <SidebarLayout sidebar={<div className="bg-gray-800 p-4 text-white">Sidebar</div>}>
            <div className="bg-gray-700 p-4 text-white">Main content</div>
          </SidebarLayout>

          <GridList>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="rounded bg-gray-800 p-4 text-white">
                Grid item {n}
              </div>
            ))}
          </GridList>
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-bold">Cards</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Bloodborne</CardTitle>
              <CardDescription>PS4 | Platinum</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white">Ένα από τα πιο επικά τρόπαια που έπιασα.</p>
            </CardContent>
            <CardFooter>
              <Button variant="secondary">Δες Guide</Button>
            </CardFooter>
          </Card>
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-bold">Modal</h2>
        <Button onClick={() => setOpenModal(true)}>Άνοιγμα Modal</Button>

        <Modal isOpen={openModal} onClose={() => setOpenModal(false)} title="Προειδοποίηση">
          <p>Αυτό είναι ένα demo modal για το UI Kit.</p>
        </Modal>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Skeleton</h2>
        <div className="space-y-6">
          <Skeleton type="card" />
          <Skeleton type="grid" count={6} />
          <Skeleton type="page" />
        </div>
      </section>
    </div>
  );
}
