import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PlusCircle, Scroll } from 'lucide-react';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { getUserSettings } from '@/lib/settings';
import { getAllMySheetsAcrossCampaigns } from '@/lib/dnd/queries/characterSheet';
import { listCampaignsForUser } from '@/lib/dnd/queries/campaigns';
import { PageContainer } from '@/app/components/layout';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CreateCharacterButton } from './CreateCharacterButton';

export default async function MyCharactersPage() {
  const supabase = await createRouteHandlerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  const settings = await getUserSettings(session.user.id, { supabase });
  if (!settings.dnd_enabled) {
    redirect('/settings');
  }

  let sheets: Awaited<ReturnType<typeof getAllMySheetsAcrossCampaigns>> = [];
  let campaigns: Awaited<ReturnType<typeof listCampaignsForUser>> = [];
  let pageError: string | null = null;

  try {
    [sheets, campaigns] = await Promise.all([
      getAllMySheetsAcrossCampaigns(supabase, session.user.id),
      listCampaignsForUser(supabase, session.user.id),
    ]);
  } catch (err) {
    pageError = err instanceof Error ? err.message : String(err);
    console.error('[MyCharactersPage]', err);
  }

  return (
    <main className="pb-10 pt-6 md:pb-16 md:pt-8">
      <PageContainer size="lg" className="space-y-6">
        {pageError ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            <p className="font-semibold">Error loading characters:</p>
            <p className="mt-1 font-mono text-xs">{pageError}</p>
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-4">
          <PageHeader
            title="My Characters"
            description="All your character sheets across campaigns"
            eyebrow="D&D"
            align="left"
          />
          {campaigns.length > 0 && (
            <CreateCharacterButton campaigns={campaigns} />
          )}
        </div>

        {sheets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <Scroll className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="font-medium text-foreground">No character sheets yet</p>
            {campaigns.length > 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Click <span className="font-medium">New Character</span> above to create your first character.
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                Join a campaign first, then create your character here.{' '}
                <Link href="/dnd/campaigns" className="underline underline-offset-2 hover:text-foreground">
                  Browse campaigns
                </Link>
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sheets.map(sheet => (
              <Link
                key={sheet.id}
                href={`/dnd/campaigns/${sheet.campaign_id}?tab=character-sheet`}
                className="block"
              >
                <Card className="h-full cursor-pointer shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {sheet.character_name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Level {sheet.level}
                          {sheet.class ? ` ${sheet.class}` : ''}
                          {sheet.race ? ` · ${sheet.race}` : ''}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {sheet.campaign_name}
                      </Badge>
                    </div>

                    {(sheet.hp_current !== null || sheet.ac !== null) ? (
                      <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                        {sheet.hp_current !== null && (
                          <span>HP {sheet.hp_current}/{sheet.hp_max ?? '?'}</span>
                        )}
                        {sheet.ac !== null && <span>AC {sheet.ac}</span>}
                        <span>
                          Prof {sheet.proficiency_bonus >= 0 ? `+${sheet.proficiency_bonus}` : sheet.proficiency_bonus}
                        </span>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </PageContainer>
    </main>
  );
}
