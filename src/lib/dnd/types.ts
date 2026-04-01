export type { DndRole } from '@/lib/settings/types';

import type { DndRole } from '@/lib/settings/types';

export type CampaignMemberRole = DndRole | 'co_dm';

export type Campaign = {
  id: string;
  dm_id: string;
  name: string;
  system: string | null;
  description: string | null;
  invite_token: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignMember = {
  id: string;
  campaign_id: string;
  user_id: string;
  role: CampaignMemberRole;
  joined_at: string;
};

export type CampaignSession = {
  id: string;
  campaign_id: string;
  title: string;
  session_date: string | null;
  status: 'planned' | 'played' | 'cancelled';
  agenda: string | null;
  recap: string | null;
  dm_notes: string | null;
  recap_published: boolean;
  created_by: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type NpcStatus = 'alive' | 'dead' | 'unknown';
export type QuestStatus = 'active' | 'completed' | 'failed' | 'on_hold';
export type EntityType = 'npc' | 'location' | 'quest';

export type CampaignNpc = {
  id: string;
  campaign_id: string;
  name: string;
  role: string | null;
  status: NpcStatus;
  description: string | null;
  tags: string[];
  public_notes: string | null;
  secret_notes: string | null;
  published: boolean;
  created_by: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignLocation = {
  id: string;
  campaign_id: string;
  name: string;
  type: string | null;
  description: string | null;
  tags: string[];
  public_notes: string | null;
  secret_notes: string | null;
  published: boolean;
  created_by: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignQuest = {
  id: string;
  campaign_id: string;
  title: string;
  status: QuestStatus;
  summary: string | null;
  public_notes: string | null;
  secret_notes: string | null;
  published: boolean;
  created_by: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignEntityLink = {
  id: string;
  campaign_id: string;
  session_id: string;
  entity_type: EntityType;
  entity_id: string;
  created_at: string;
};

export type CampaignHandout = {
  id: string;
  campaign_id: string;
  title: string;
  content: string | null;
  published: boolean;
  created_by: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignAsset = {
  id: string;
  campaign_id: string;
  path: string;
  type: 'image' | 'pdf' | 'other';
  title: string | null;
  tags: string[];
  published: boolean;
  created_by: string;
  deleted_at?: string | null;
  created_at: string;
};

export type WeaponEntry = {
  name: string;
  attack_bonus: string;
  damage: string;
  damage_type: string;
  range: string;
  notes: string;
};

export type CharacterSheet = {
  id: string;
  campaign_id: string;
  user_id: string;
  character_name: string;
  race: string | null;
  class: string | null;
  subclass: string | null;
  level: number;
  background: string | null;
  alignment: string | null;
  str: number | null;
  dex: number | null;
  con: number | null;
  int_stat: number | null;
  wis: number | null;
  cha: number | null;
  hp_max: number | null;
  hp_current: number | null;
  hp_temp: number;
  ac: number | null;
  speed: number;
  initiative_bonus: number;
  proficiency_bonus: number;
  saving_throw_profs: string;
  features: string | null;
  equipment: string | null;
  spells: string | null;
  notes: string | null;
  visible_to_dm: boolean;
  dm_notes: string | null;
  // v3 fields
  skills_profs: string;
  skills_expertise: string;
  inspiration: boolean;
  death_save_successes: number;
  death_save_failures: number;
  hit_dice_type: string;
  hit_dice_spent: number;
  passive_perception: number | null;
  weapons_data: WeaponEntry[];
  languages: string | null;
  personality_traits: string | null;
  ideals: string | null;
  bonds: string | null;
  flaws: string | null;
  appearance: string | null;
  backstory: string | null;
  spellcasting_ability: string | null;
  spell_save_dc: number | null;
  spell_attack_bonus: number | null;
  spell_slots_max: Record<string, number>;
  spell_slots_used: Record<string, number>;
  spells_cantrips: string | null;
  spells_1: string | null;
  spells_2: string | null;
  spells_3: string | null;
  spells_4: string | null;
  spells_5: string | null;
  spells_6: string | null;
  spells_7: string | null;
  spells_8: string | null;
  spells_9: string | null;
  extra_resource_name: string | null;
  extra_resource_max: number | null;
  extra_resource_used: number;
  created_at: string;
  updated_at: string;
};

// Player view - without secret fields (for player-facing API responses)
export type CampaignNpcPublic = Omit<CampaignNpc, 'secret_notes'>;
export type CampaignLocationPublic = Omit<CampaignLocation, 'secret_notes'>;
export type CampaignQuestPublic = Omit<CampaignQuest, 'secret_notes'>;
export type CampaignSessionPublic = Omit<CampaignSession, 'dm_notes'>;

// API request bodies
export type CreateCampaignInput = Pick<Campaign, 'name' | 'system' | 'description'>;
export type CreateSessionInput = Pick<
  CampaignSession,
  'title' | 'session_date' | 'status' | 'agenda' | 'recap' | 'dm_notes'
>;
export type CreateNpcInput = Pick<
  CampaignNpc,
  'name' | 'role' | 'status' | 'description' | 'tags' | 'public_notes' | 'secret_notes'
>;
export type CreateLocationInput = Pick<
  CampaignLocation,
  'name' | 'type' | 'description' | 'tags' | 'public_notes' | 'secret_notes'
>;
export type CreateQuestInput = Pick<
  CampaignQuest,
  'title' | 'status' | 'summary' | 'public_notes' | 'secret_notes'
>;
export type CreateHandoutInput = Pick<CampaignHandout, 'title' | 'content' | 'published'>;

// Campaign with membership info (for list views)
export type CampaignWithRole = Campaign & {
  member_role: DndRole;
};

export type TrashEntityType = 'session' | 'npc' | 'location' | 'quest' | 'handout' | 'asset';

export type TrashItem = {
  id: string;
  name: string;
  deleted_at: string;
  path?: string | null;
};

export type TrashItems = {
  sessions: TrashItem[];
  npcs: TrashItem[];
  locations: TrashItem[];
  quests: TrashItem[];
  handouts: TrashItem[];
  assets: TrashItem[];
};

export type DndContentTable =
  | 'campaign_sessions'
  | 'campaign_npcs'
  | 'campaign_locations'
  | 'campaign_quests'
  | 'campaign_handouts'
  | 'campaign_assets'
  | 'campaigns';

export type DndReferenceCategory =
  | 'spells'
  | 'monsters'
  | 'magic-items'
  | 'conditions'
  | 'backgrounds'
  | 'feats'
  | 'planes'
  | 'classes'
  | 'sections'
  | 'races'
  | 'weapons'
  | 'armor';

export type ReferenceSearchResult = {
  index: string;
  name: string;
  category: DndReferenceCategory;
  url: string;
  source?: string;
};

// Open5e v1 response shapes

export type SpellDetail = {
  slug: string;
  name: string;
  level_int: number;
  school: string;
  casting_time: string;
  range: string;
  components: string;
  material?: string;
  ritual: string;
  concentration: string;
  duration: string;
  desc: string;
  higher_level?: string;
  class: string;
  document__title?: string;
};

export type MonsterDetail = {
  slug: string;
  name: string;
  size: string;
  type: string;
  alignment: string;
  armor_class: number;
  armor_desc?: string;
  hit_points: number;
  hit_dice: string;
  speed: Record<string, string>;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  challenge_rating: string;
  cr: number;
  xp: number;
  document__title?: string;
  special_abilities?: { name: string; desc: string }[];
  actions?: { name: string; desc: string }[];
  legendary_actions?: { name: string; desc: string }[];
};

export type ConditionDetail = {
  slug: string;
  name: string;
  desc: string;
  document__title?: string;
};

export type MagicItemDetail = {
  slug: string;
  name: string;
  type: string;
  rarity: string;
  requires_attunement?: string;
  desc: string;
  document__title?: string;
};

export type GenericDetail = {
  slug: string;
  name: string;
  desc: string;
  document__title?: string;
  [key: string]: unknown;
};

export type RaceDetail = {
  slug: string;
  name: string;
  desc: string;
  asi_desc?: string;
  asi?: { attributes: string[]; value: number }[];
  age?: string;
  alignment?: string;
  size?: string;
  size_raw?: string;
  speed?: Record<string, number>;
  speed_desc?: string;
  languages?: string;
  vision?: string;
  traits?: string;
  subraces?: { name: string; desc?: string; traits?: string; slug?: string }[];
  document__title?: string;
};

export type WeaponDetail = {
  slug: string;
  name: string;
  category: string;
  cost: string;
  damage_dice: string;
  damage_type: string;
  weight: string;
  properties?: string[];
  document__title?: string;
};

export type ArmorDetail = {
  slug: string;
  name: string;
  category: string;
  cost: string;
  weight: string;
  base_ac: number;
  plus_dex_mod: boolean;
  plus_con_mod: boolean;
  stealth_disadvantage: boolean;
  strength_requirement?: number;
  document__title?: string;
};
