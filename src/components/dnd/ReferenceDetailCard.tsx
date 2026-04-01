'use client';

import { useMemo } from 'react';
import { BookOpen, Heart, Shield, Sparkles, Sword, Zap } from 'lucide-react';
import type {
  ArmorDetail,
  ConditionDetail,
  GenericDetail,
  MagicItemDetail,
  MonsterDetail,
  RaceDetail,
  ReferenceSearchResult,
  SpellDetail,
  WeaponDetail,
} from '@/lib/dnd/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';

type ReferenceDetailPayload =
  | SpellDetail
  | MonsterDetail
  | ConditionDetail
  | MagicItemDetail
  | RaceDetail
  | WeaponDetail
  | ArmorDetail
  | GenericDetail;

type ReferenceDetailCardProps = {
  result: ReferenceSearchResult | null;
  detail: ReferenceDetailPayload | null;
  loading: boolean;
  error: string | null;
};

function getAbilityModifier(score: number): string {
  const modifier = Math.floor((score - 10) / 2);
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

function spellLevelLabel(level: number) {
  if (level === 0) return 'Cantrip';
  if (level === 1) return '1st level';
  if (level === 2) return '2nd level';
  if (level === 3) return '3rd level';
  return `${level}th level`;
}

function DescBlock({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {text.split('\n').map((paragraph, index) => {
        if (!paragraph.trim()) return null;
        return (
          <p
            key={index}
            className="text-sm leading-relaxed text-foreground"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {paragraph}
          </p>
        );
      })}
    </div>
  );
}

function SourceBadge({ title }: { title?: string }) {
  if (!title) return null;
  return <Badge variant="outline" className="text-xs text-muted-foreground">{title}</Badge>;
}

function SpellView({ detail }: { detail: SpellDetail }) {
  const isRitual = detail.ritual === 'yes' || detail.ritual === 'true';
  const isConcentration = detail.concentration === 'yes' || detail.concentration === 'true';

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold">
            {detail.name} —{' '}
            {spellLevelLabel(detail.level_int)} {detail.school}
          </CardTitle>
          <SourceBadge title={detail.document__title} />
        </div>
        <div className="flex flex-wrap gap-2">
          {isConcentration ? (
            <Badge className="border-warning/30 bg-warning/15 text-warning">Concentration</Badge>
          ) : null}
          {isRitual ? <Badge variant="secondary">Ritual</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <p>
            <span className="font-semibold text-foreground">Casting Time:</span>{' '}
            {detail.casting_time}
          </p>
          <p>
            <span className="font-semibold text-foreground">Range:</span> {detail.range}
          </p>
          <p>
            <span className="font-semibold text-foreground">Components:</span> {detail.components}
            {detail.material ? ` (${detail.material})` : ''}
          </p>
          <p>
            <span className="font-semibold text-foreground">Duration:</span> {detail.duration}
          </p>
        </div>

        <DescBlock text={detail.desc} />

        {detail.higher_level ? (
          <section className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <h4 className="text-sm font-semibold text-foreground">At Higher Levels</h4>
            <DescBlock text={detail.higher_level} />
          </section>
        ) : null}

        {detail.class ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Available to:</span> {detail.class}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function MonsterView({ detail }: { detail: MonsterDetail }) {
  const speedText = Object.entries(detail.speed ?? {})
    .map(([kind, value]) => `${kind}: ${value}`)
    .join(', ');

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold">{detail.name}</CardTitle>
          <SourceBadge title={detail.document__title} />
        </div>
        <p className="text-sm text-muted-foreground">
          {detail.size} {detail.type}, {detail.alignment}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-3">
          <p className="inline-flex items-center gap-1">
            <Shield className="size-4" />
            <span>
              <span className="font-semibold text-foreground">AC:</span> {detail.armor_class}
              {detail.armor_desc ? ` (${detail.armor_desc})` : ''}
            </span>
          </p>
          <p className="inline-flex items-center gap-1">
            <Heart className="size-4" />
            <span>
              <span className="font-semibold text-foreground">HP:</span> {detail.hit_points} (
              {detail.hit_dice})
            </span>
          </p>
          <p>
            <span className="font-semibold text-foreground">Speed:</span> {speedText}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'STR', value: detail.strength },
            { label: 'DEX', value: detail.dexterity },
            { label: 'CON', value: detail.constitution },
            { label: 'INT', value: detail.intelligence },
            { label: 'WIS', value: detail.wisdom },
            { label: 'CHA', value: detail.charisma },
          ].map(stat => (
            <div
              key={stat.label}
              className="rounded-lg border border-border bg-muted/30 p-3 text-center"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
              <p className="text-xl font-semibold tabular-nums text-foreground">{stat.value}</p>
              <p className="text-sm font-semibold text-primary">{getAbilityModifier(stat.value)}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-primary/30 bg-primary/15 text-primary">
            CR {detail.challenge_rating}
          </Badge>
          <Badge variant="secondary">XP {detail.xp}</Badge>
        </div>

        <Accordion type="multiple" className="rounded-lg border border-border px-3">
          {detail.special_abilities && detail.special_abilities.length > 0 ? (
            <AccordionItem value="special-abilities">
              <AccordionTrigger>Special Abilities</AccordionTrigger>
              <AccordionContent className="space-y-3">
                {detail.special_abilities.map(item => (
                  <div key={item.name} className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ) : null}
          {detail.actions && detail.actions.length > 0 ? (
            <AccordionItem value="actions">
              <AccordionTrigger>Actions</AccordionTrigger>
              <AccordionContent className="space-y-3">
                {detail.actions.map(item => (
                  <div key={item.name} className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ) : null}
          {detail.legendary_actions && detail.legendary_actions.length > 0 ? (
            <AccordionItem value="legendary-actions">
              <AccordionTrigger>Legendary Actions</AccordionTrigger>
              <AccordionContent className="space-y-3">
                {detail.legendary_actions.map(item => (
                  <div key={item.name} className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ) : null}
        </Accordion>
      </CardContent>
    </Card>
  );
}

function ConditionView({ detail }: { detail: ConditionDetail }) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold">{detail.name}</CardTitle>
          <SourceBadge title={detail.document__title} />
        </div>
      </CardHeader>
      <CardContent>
        <DescBlock text={detail.desc} />
      </CardContent>
    </Card>
  );
}

function MagicItemView({ detail }: { detail: MagicItemDetail }) {
  const requiresAttunement =
    detail.requires_attunement && detail.requires_attunement.trim().length > 0;

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold">{detail.name}</CardTitle>
          <SourceBadge title={detail.document__title} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-primary/30 bg-primary/15 text-primary capitalize">
            {detail.rarity}
          </Badge>
          {detail.type ? <Badge variant="secondary">{detail.type}</Badge> : null}
          {requiresAttunement ? (
            <Badge className="border-warning/30 bg-warning/15 text-warning">
              Requires Attunement
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <DescBlock text={detail.desc} />
      </CardContent>
    </Card>
  );
}

function RaceView({ detail }: { detail: RaceDetail }) {
  const speedText = detail.speed
    ? Object.entries(detail.speed)
        .map(([kind, value]) => `${kind}: ${value} ft.`)
        .join(', ')
    : null;

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold">{detail.name}</CardTitle>
          <SourceBadge title={detail.document__title} />
        </div>
        {detail.size_raw ? (
          <p className="text-sm text-muted-foreground">{detail.size_raw} creature</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {speedText ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Speed:</span> {speedText}
          </p>
        ) : null}
        {detail.asi_desc ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Ability Score Increase:</span>{' '}
            {detail.asi_desc.replace(/^\*+[^*]+\*+\s*/, '')}
          </p>
        ) : null}
        {detail.age ? (
          <section className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">Age</h4>
            <p className="text-sm text-muted-foreground">
              {detail.age.replace(/^\*+[^*]+\*+\s*/, '')}
            </p>
          </section>
        ) : null}
        {detail.languages ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Languages:</span>{' '}
            {detail.languages.replace(/^\*+[^*]+\*+\s*/, '')}
          </p>
        ) : null}
        {detail.vision ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Vision:</span>{' '}
            {detail.vision.replace(/^\*+[^*]+\*+\s*/, '')}
          </p>
        ) : null}
        {detail.traits ? (
          <section className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">Traits</h4>
            <DescBlock text={detail.traits.replace(/\*\*\*/g, '').replace(/\*\*/g, '')} />
          </section>
        ) : null}
        {detail.subraces && detail.subraces.length > 0 ? (
          <Accordion type="multiple" className="rounded-lg border border-border px-3">
            <AccordionItem value="subraces">
              <AccordionTrigger>Subraces ({detail.subraces.length})</AccordionTrigger>
              <AccordionContent className="space-y-4">
                {detail.subraces.map(sub => (
                  <div key={sub.slug ?? sub.name} className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{sub.name}</p>
                    {sub.traits ? (
                      <p className="text-sm text-muted-foreground">
                        {sub.traits.replace(/\*\*\*/g, '').replace(/\*\*/g, '')}
                      </p>
                    ) : null}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : null}
      </CardContent>
    </Card>
  );
}

function WeaponView({ detail }: { detail: WeaponDetail }) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold">{detail.name}</CardTitle>
          <SourceBadge title={detail.document__title} />
        </div>
        <Badge variant="secondary">{detail.category}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Damage:</span> {detail.damage_dice}{' '}
            {detail.damage_type}
          </p>
          <p>
            <span className="font-semibold text-foreground">Cost:</span> {detail.cost}
          </p>
          <p>
            <span className="font-semibold text-foreground">Weight:</span> {detail.weight}
          </p>
        </div>
        {detail.properties && detail.properties.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {detail.properties.map(prop => (
              <Badge key={prop} variant="outline" className="text-xs">
                {prop}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ArmorView({ detail }: { detail: ArmorDetail }) {
  const acText = detail.plus_dex_mod
    ? `${detail.base_ac} + Dex mod`
    : detail.plus_con_mod
      ? `${detail.base_ac} + Con mod`
      : `${detail.base_ac}`;

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold">{detail.name}</CardTitle>
          <SourceBadge title={detail.document__title} />
        </div>
        <Badge variant="secondary">{detail.category}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <p className="inline-flex items-center gap-1">
            <Shield className="size-4" />
            <span>
              <span className="font-semibold text-foreground">AC:</span> {acText}
            </span>
          </p>
          <p>
            <span className="font-semibold text-foreground">Cost:</span> {detail.cost}
          </p>
          <p>
            <span className="font-semibold text-foreground">Weight:</span> {detail.weight}
          </p>
          {detail.strength_requirement ? (
            <p>
              <span className="font-semibold text-foreground">Str required:</span>{' '}
              {detail.strength_requirement}
            </p>
          ) : null}
        </div>
        {detail.stealth_disadvantage ? (
          <Badge className="border-destructive/30 bg-destructive/15 text-destructive">
            Stealth Disadvantage
          </Badge>
        ) : null}
      </CardContent>
    </Card>
  );
}

function GenericView({ detail }: { detail: GenericDetail }) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold">{detail.name}</CardTitle>
          <SourceBadge title={detail.document__title} />
        </div>
      </CardHeader>
      <CardContent>
        {detail.desc ? <DescBlock text={detail.desc} /> : null}
      </CardContent>
    </Card>
  );
}

export function ReferenceDetailCard({ result, detail, loading, error }: ReferenceDetailCardProps) {
  const content = useMemo(() => {
    if (!result) {
      return (
        <EmptyState
          icon={<BookOpen className="size-5" />}
          title="Select a result"
          description="Pick an entry on the left to view its details."
        />
      );
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Unable to load detail</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (!detail) {
      return (
        <EmptyState
          size="sm"
          icon={<Sword className="size-5" />}
          title="No detail loaded"
          description="Select an entry to load its details."
        />
      );
    }

    if (result.category === 'spells') return <SpellView detail={detail as SpellDetail} />;
    if (result.category === 'monsters') return <MonsterView detail={detail as MonsterDetail} />;
    if (result.category === 'conditions') return <ConditionView detail={detail as ConditionDetail} />;
    if (result.category === 'magic-items') return <MagicItemView detail={detail as MagicItemDetail} />;
    if (result.category === 'races') return <RaceView detail={detail as RaceDetail} />;
    if (result.category === 'weapons') return <WeaponView detail={detail as WeaponDetail} />;
    if (result.category === 'armor') return <ArmorView detail={detail as ArmorDetail} />;

    return <GenericView detail={detail as GenericDetail} />;
  }, [detail, error, loading, result]);

  return (
    <div className="space-y-3">
      {result && !loading && (
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Powered by{' '}
            <a
              href="https://open5e.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Open5e
            </a>
          </p>
        </div>
      )}
      {content}
    </div>
  );
}
