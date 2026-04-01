import { ChevronRight, Shield, User } from 'lucide-react';
import type { CampaignWithRole } from '@/lib/dnd/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  campaign: CampaignWithRole;
};

export function CampaignCard({ campaign }: Props) {
  const isDm = campaign.member_role === 'dm';

  return (
    <Card className="shadow-sm transition-colors hover:bg-[hsl(var(--surface-hover))]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">{campaign.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{campaign.system ?? 'System not set'}</p>
          </div>
          <Badge
            variant={isDm ? 'default' : 'secondary'}
            className={isDm ? 'gap-1' : undefined}
          >
            {isDm ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
            {isDm ? 'DM' : 'Player'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm leading-relaxed text-muted-foreground" style={{ fontFamily: 'var(--font-serif)' }}>
          {campaign.description?.trim() || 'No campaign description yet.'}
        </p>
      </CardContent>
      <CardFooter>
        <Button href={`/dnd/campaigns/${campaign.id}`} className="w-full sm:w-auto" icon={<ChevronRight />}>
          Open
        </Button>
      </CardFooter>
    </Card>
  );
}
