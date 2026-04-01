import { Link2Off } from 'lucide-react';
import { PageContainer } from '@/app/components/layout';
import { PageHeader } from '@/app/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function JoinInviteNotFound() {
  return (
    <main className="pb-10 pt-6 md:pb-16 md:pt-8">
      <PageContainer size="lg" className="space-y-6">
        <PageHeader
          title="Invite Not Found"
          description="This invite link is invalid or has expired."
          eyebrow="D&D Invite"
          align="left"
        />

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2Off className="h-4 w-4 text-muted-foreground" />
              Invalid or expired invite link
            </CardTitle>
            <CardDescription>
              Ask your DM to generate a fresh invite link and try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button href="/dnd/campaigns" variant="outline">
              Back to Campaigns
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    </main>
  );
}
