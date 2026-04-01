import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CampaignLocation,
  CampaignLocationPublic,
  CreateLocationInput,
} from '@/lib/dnd/types';

const DM_LOCATION_FIELDS =
  'id,campaign_id,name,type,description,tags,public_notes,secret_notes,published,created_by,created_at,updated_at';
const PLAYER_LOCATION_FIELDS =
  'id,campaign_id,name,type,description,tags,public_notes,published,created_by,created_at,updated_at';

type LocationInput = CreateLocationInput & {
  published?: boolean;
};

export async function listLocations(
  supabase: SupabaseClient,
  campaignId: string,
  isDm: boolean,
): Promise<CampaignLocation[] | CampaignLocationPublic[]> {
  const fields = isDm ? DM_LOCATION_FIELDS : PLAYER_LOCATION_FIELDS;

  let query = supabase.from('campaign_locations').select(fields).eq('campaign_id', campaignId);
  query = query.is('deleted_at', null);

  if (!isDm) {
    query = query.eq('published', true);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list locations: ${error.message}`);
  }

  return (data ?? []) as unknown as CampaignLocation[] | CampaignLocationPublic[];
}

export async function getLocation(
  supabase: SupabaseClient,
  campaignId: string,
  locationId: string,
  isDm: boolean,
): Promise<CampaignLocation | CampaignLocationPublic | null> {
  const fields = isDm ? DM_LOCATION_FIELDS : PLAYER_LOCATION_FIELDS;

  let query = supabase
    .from('campaign_locations')
    .select(fields)
    .eq('campaign_id', campaignId)
    .eq('id', locationId)
    .is('deleted_at', null);

  if (!isDm) {
    query = query.eq('published', true);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch location: ${error.message}`);
  }

  return (data as unknown as CampaignLocation | CampaignLocationPublic | null) ?? null;
}

export async function createLocation(
  supabase: SupabaseClient,
  campaignId: string,
  input: LocationInput,
  createdBy: string,
): Promise<CampaignLocation> {
  const { data, error } = await supabase
    .from('campaign_locations')
    .insert({
      campaign_id: campaignId,
      name: input.name,
      type: input.type,
      description: input.description,
      tags: input.tags,
      public_notes: input.public_notes,
      secret_notes: input.secret_notes,
      published: input.published ?? false,
      created_by: createdBy,
    })
    .select(DM_LOCATION_FIELDS)
    .single();

  if (error) {
    throw new Error(`Failed to create location: ${error.message}`);
  }

  return data as unknown as CampaignLocation;
}

export async function updateLocation(
  supabase: SupabaseClient,
  campaignId: string,
  locationId: string,
  input: Partial<LocationInput>,
): Promise<CampaignLocation> {
  const { data, error } = await supabase
    .from('campaign_locations')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('campaign_id', campaignId)
    .eq('id', locationId)
    .is('deleted_at', null)
    .select(DM_LOCATION_FIELDS)
    .single();

  if (error) {
    throw new Error(`Failed to update location: ${error.message}`);
  }

  return data as unknown as CampaignLocation;
}

export async function deleteLocation(
  supabase: SupabaseClient,
  campaignId: string,
  locationId: string,
): Promise<void> {
  const { error } = await supabase
    .from('campaign_locations')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('campaign_id', campaignId)
    .eq('id', locationId)
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Failed to delete location: ${error.message}`);
  }
}
