import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import getSupabaseServer from '@/lib/supabase-server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { Skeleton } from '@/components/ui/skeleton';
import PublicBacklogClient from './PublicBacklogClient';
import type { MediaCategory } from '@/app/components/backlog/types';

export const revalidate = 60;

type PageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ category?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username}'s Library | Hobbistas`,
    description: `Browse ${username}'s read-only media library on Hobbistas.`,
    robots: { index: false },
  };
}

function PageSkeleton() {
  return (
    <div className="space-y-4 px-4 py-6 md:px-6 md:py-8">
      <Skeleton className="h-9 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export default async function PublicBacklogPage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const { category } = await searchParams;

  const supabase = getSupabaseServer();
  const { data: user } = await supabase
    .from('users')
    .select('id,username,privacy_settings')
    .eq('username', username)
    .maybeSingle();

  if (!user) {
    notFound();
  }

  const privacy = user.privacy_settings as { profile_visibility?: string } | null;
  if (privacy?.profile_visibility === 'private') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-2xl font-semibold text-foreground">Private Profile</p>
        <p className="mt-2 text-muted-foreground">
          This user&apos;s library is private. Ask them for a share link.
        </p>
      </div>
    );
  }

  const { data: categoryProfile } = await supabase
    .from('user_category_profiles')
    .select('profiles')
    .eq('user_id', user.id)
    .maybeSingle();
  const profiles = (categoryProfile?.profiles as Record<string, unknown> | null) ?? null;

  // Determine the default category (first enabled one, fallback to 'anime')
  const profileKeys = profiles ? Object.keys(profiles) : [];
  const defaultCategory: MediaCategory =
    (category as MediaCategory | undefined) ??
    (profileKeys[0] as MediaCategory | undefined) ??
    'anime';

  const routeClient = await createRouteHandlerClient();
  const {
    data: { session },
  } = await routeClient.auth.getSession();
  const canToggleFavorite = session?.user?.id === user.id;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <PublicBacklogClient
        userId={user.id}
        username={user.username}
        defaultCategory={defaultCategory}
        canToggleFavorite={canToggleFavorite}
      />
    </Suspense>
  );
}
