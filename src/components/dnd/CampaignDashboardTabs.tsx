'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AssetsList } from '@/components/dnd/AssetsList';
import { CampaignSettingsPanel } from '@/components/dnd/CampaignSettingsPanel';
import { CharacterSheetManager } from '@/components/dnd/CharacterSheetManager';
import { CharacterSheetsList } from '@/components/dnd/CharacterSheetsList';
import { HandoutsList } from '@/components/dnd/HandoutsList';
import { LocationsList } from '@/components/dnd/LocationsList';
import { NpcsList } from '@/components/dnd/NpcsList';
import { QuestsList } from '@/components/dnd/QuestsList';
import { SessionsList } from '@/components/dnd/SessionsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type CampaignDashboardRole = 'dm' | 'co_dm' | 'player';

type CampaignDashboardTabsProps = {
  campaignId: string;
  role: CampaignDashboardRole;
  initialTab?: string;
};

type CampaignTab = {
  value: string;
  label: string;
  dmOnly?: boolean;
};

const CAMPAIGN_TABS: CampaignTab[] = [
  { value: 'sessions', label: 'Sessions' },
  { value: 'npcs', label: 'NPCs' },
  { value: 'locations', label: 'Locations' },
  { value: 'quests', label: 'Quests' },
  { value: 'handouts', label: 'Handouts' },
  { value: 'assets', label: 'Assets' },
  { value: 'character-sheet', label: 'Character Sheet' },
  { value: 'settings', label: 'Settings', dmOnly: true },
];

export function CampaignDashboardTabs({
  campaignId,
  role,
  initialTab,
}: CampaignDashboardTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDm = role === 'dm' || role === 'co_dm';

  const tabs = useMemo(() => CAMPAIGN_TABS.filter(tab => (tab.dmOnly ? isDm : true)), [isDm]);

  const activeTab = useMemo(() => {
    const searchTab = searchParams.get('tab');
    const candidate = searchTab ?? initialTab;
    if (candidate && tabs.some(tab => tab.value === candidate)) {
      return candidate;
    }
    return tabs[0]?.value ?? 'sessions';
  }, [initialTab, searchParams, tabs]);

  const handleTabChange = (nextTab: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('tab', nextTab);
    const queryString = nextParams.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <TabsList className="h-auto w-max min-w-full justify-start gap-1">
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {tabs.map(tab => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.value === 'sessions' ? <SessionsList campaignId={campaignId} role={role} /> : null}
          {tab.value === 'npcs' ? <NpcsList campaignId={campaignId} isDm={isDm} /> : null}
          {tab.value === 'locations' ? <LocationsList campaignId={campaignId} isDm={isDm} /> : null}
          {tab.value === 'quests' ? <QuestsList campaignId={campaignId} isDm={isDm} /> : null}
          {tab.value === 'handouts' ? <HandoutsList campaignId={campaignId} isDm={isDm} /> : null}
          {tab.value === 'assets' ? <AssetsList campaignId={campaignId} isDm={isDm} /> : null}
          {tab.value === 'character-sheet' ? (
            isDm ? (
              <div className="space-y-8">
                <CharacterSheetManager campaignId={campaignId} />
                <div>
                  <p className="mb-3 text-sm font-semibold text-muted-foreground">
                    Player Sheets (shared with DM)
                  </p>
                  <CharacterSheetsList campaignId={campaignId} />
                </div>
              </div>
            ) : (
              <CharacterSheetManager campaignId={campaignId} />
            )
          ) : null}
          {tab.value === 'settings' ? <CampaignSettingsPanel campaignId={campaignId} /> : null}
          {tab.value !== 'sessions' &&
          tab.value !== 'npcs' &&
          tab.value !== 'locations' &&
          tab.value !== 'quests' &&
          tab.value !== 'handouts' &&
          tab.value !== 'assets' &&
          tab.value !== 'character-sheet' &&
          tab.value !== 'settings' ? (
            <p className="text-sm text-muted-foreground">Coming soon</p>
          ) : null}
        </TabsContent>
      ))}
    </Tabs>
  );
}
