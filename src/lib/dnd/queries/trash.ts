import type { SupabaseClient } from '@supabase/supabase-js';
import type { DndContentTable, TrashEntityType, TrashItem, TrashItems } from '@/lib/dnd/types';

const RESTORE_WINDOW_DAYS = 30;

function getRestoreThresholdIso() {
  return new Date(Date.now() - RESTORE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

function mapRowsToTrashItems(
  rows: Array<{ id: string; deleted_at: string; name?: string; title?: string | null; path?: string }>,
): TrashItem[] {
  return rows.map(row => ({
    id: row.id,
    name: row.name ?? row.title ?? row.path ?? 'Untitled',
    deleted_at: row.deleted_at,
    path: row.path ?? null,
  }));
}

export async function getTrashItems(supabase: SupabaseClient, campaignId: string): Promise<TrashItems> {
  const threshold = getRestoreThresholdIso();

  const [sessionsResult, npcsResult, locationsResult, questsResult, handoutsResult, assetsResult] =
    await Promise.all([
      supabase
        .from('campaign_sessions')
        .select('id,title,deleted_at')
        .eq('campaign_id', campaignId)
        .not('deleted_at', 'is', null)
        .gt('deleted_at', threshold)
        .order('deleted_at', { ascending: false }),
      supabase
        .from('campaign_npcs')
        .select('id,name,deleted_at')
        .eq('campaign_id', campaignId)
        .not('deleted_at', 'is', null)
        .gt('deleted_at', threshold)
        .order('deleted_at', { ascending: false }),
      supabase
        .from('campaign_locations')
        .select('id,name,deleted_at')
        .eq('campaign_id', campaignId)
        .not('deleted_at', 'is', null)
        .gt('deleted_at', threshold)
        .order('deleted_at', { ascending: false }),
      supabase
        .from('campaign_quests')
        .select('id,title,deleted_at')
        .eq('campaign_id', campaignId)
        .not('deleted_at', 'is', null)
        .gt('deleted_at', threshold)
        .order('deleted_at', { ascending: false }),
      supabase
        .from('campaign_handouts')
        .select('id,title,deleted_at')
        .eq('campaign_id', campaignId)
        .not('deleted_at', 'is', null)
        .gt('deleted_at', threshold)
        .order('deleted_at', { ascending: false }),
      supabase
        .from('campaign_assets')
        .select('id,title,path,deleted_at')
        .eq('campaign_id', campaignId)
        .not('deleted_at', 'is', null)
        .gt('deleted_at', threshold)
        .order('deleted_at', { ascending: false }),
    ]);

  const errors = [
    sessionsResult.error,
    npcsResult.error,
    locationsResult.error,
    questsResult.error,
    handoutsResult.error,
    assetsResult.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(`Failed to load trash items: ${errors[0]?.message}`);
  }

  return {
    sessions: mapRowsToTrashItems(
      (sessionsResult.data ?? []) as Array<{ id: string; title: string; deleted_at: string }>,
    ),
    npcs: mapRowsToTrashItems(
      (npcsResult.data ?? []) as Array<{ id: string; name: string; deleted_at: string }>,
    ),
    locations: mapRowsToTrashItems(
      (locationsResult.data ?? []) as Array<{ id: string; name: string; deleted_at: string }>,
    ),
    quests: mapRowsToTrashItems(
      (questsResult.data ?? []) as Array<{ id: string; title: string; deleted_at: string }>,
    ),
    handouts: mapRowsToTrashItems(
      (handoutsResult.data ?? []) as Array<{ id: string; title: string; deleted_at: string }>,
    ),
    assets: mapRowsToTrashItems(
      (assetsResult.data ?? []) as Array<{
        id: string;
        title: string | null;
        path: string;
        deleted_at: string;
      }>,
    ),
  };
}

const ENTITY_TABLE_MAP: Record<TrashEntityType, DndContentTable> = {
  session: 'campaign_sessions',
  npc: 'campaign_npcs',
  location: 'campaign_locations',
  quest: 'campaign_quests',
  handout: 'campaign_handouts',
  asset: 'campaign_assets',
};

function tableNeedsUpdatedAt(table: DndContentTable): boolean {
  return table !== 'campaign_assets';
}

export async function softDelete(supabase: SupabaseClient, table: DndContentTable, id: string): Promise<void> {
  const payload: Record<string, string> = {
    deleted_at: new Date().toISOString(),
  };
  if (tableNeedsUpdatedAt(table)) {
    payload.updated_at = new Date().toISOString();
  }

  const { error } = await supabase.from(table).update(payload).eq('id', id).is('deleted_at', null);
  if (error) {
    throw new Error(`Failed to soft delete row in ${table}: ${error.message}`);
  }
}

export async function restoreItem(
  supabase: SupabaseClient,
  campaignId: string,
  entityType: TrashEntityType,
  entityId: string,
): Promise<void> {
  const table = ENTITY_TABLE_MAP[entityType];
  const threshold = getRestoreThresholdIso();

  const payload: Record<string, string | null> = { deleted_at: null };
  if (tableNeedsUpdatedAt(table)) {
    payload.updated_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from(table)
    .update(payload)
    .eq('campaign_id', campaignId)
    .eq('id', entityId)
    .not('deleted_at', 'is', null)
    .gt('deleted_at', threshold);

  if (error) {
    throw new Error(`Failed to restore ${entityType}: ${error.message}`);
  }
}

export async function permanentlyDeleteItem(
  supabase: SupabaseClient,
  campaignId: string,
  entityType: TrashEntityType,
  entityId: string,
): Promise<{ storagePath?: string | null }> {
  const table = ENTITY_TABLE_MAP[entityType];
  const threshold = getRestoreThresholdIso();

  const selection = entityType === 'asset' ? 'id,path' : 'id';
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq('campaign_id', campaignId)
    .eq('id', entityId)
    .not('deleted_at', 'is', null)
    .gt('deleted_at', threshold)
    .select(selection)
    .maybeSingle<{ id: string; path?: string | null }>();

  if (error) {
    throw new Error(`Failed to permanently delete ${entityType}: ${error.message}`);
  }

  return { storagePath: data?.path ?? null };
}
