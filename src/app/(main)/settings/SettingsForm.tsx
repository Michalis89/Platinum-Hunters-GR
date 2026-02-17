'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { ThemeSetting } from '@/lib/settings/types';
import {
  USER_SETTINGS_DEFAULTS,
  type UserSettingsData,
  type UserSettingsValue,
} from '@/lib/settings/types';
import { useTheme } from '@/context/ThemeContext';
import { useUserSettings } from '@/lib/settings/useUserSettings';

const toFormState = (settings: UserSettingsData): UserSettingsValue => ({
  theme: settings.theme,
  social_enabled: settings.social_enabled,
  community_activity_enabled: settings.community_activity_enabled,
  community_suggestions_enabled: settings.community_suggestions_enabled,
  articles_enabled: settings.articles_enabled,
  reviews_enabled: settings.reviews_enabled,
});

type SettingsFormProps = {
  initialSettings: UserSettingsData;
};

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [formState, setFormState] = useState<UserSettingsValue>(() => toFormState(initialSettings));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isResetDialogOpen, setResetDialogOpen] = useState(false);
  const [isMounted, setMounted] = useState(false);
  const { mutate } = useUserSettings(true);
  const { setTheme } = useTheme();

  const applyThemePreference = (preference: ThemeSetting) => {
    if (preference === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
      return;
    }
    setTheme(preference);
  };

  const updateSetting = async (patch: Partial<UserSettingsValue>) => {
    if (isSaving) {
      return;
    }

    const normalized = { ...patch };
    if (patch.social_enabled === false) {
      normalized.community_activity_enabled = false;
      normalized.community_suggestions_enabled = false;
    }

    const sanitized: Partial<UserSettingsValue> = {};
    if (normalized.theme !== undefined) {
      sanitized.theme = normalized.theme;
    }
    if (normalized.social_enabled !== undefined) {
      sanitized.social_enabled = normalized.social_enabled;
    }
    if (normalized.community_activity_enabled !== undefined) {
      sanitized.community_activity_enabled = normalized.community_activity_enabled;
    }
    if (normalized.community_suggestions_enabled !== undefined) {
      sanitized.community_suggestions_enabled = normalized.community_suggestions_enabled;
    }
    if (normalized.articles_enabled !== undefined) {
      sanitized.articles_enabled = normalized.articles_enabled;
    }
    if (normalized.reviews_enabled !== undefined) {
      sanitized.reviews_enabled = normalized.reviews_enabled;
    }

    if (Object.keys(sanitized).length === 0) {
      return;
    }

    const previousState = formState;
    const optimisticState = { ...formState, ...sanitized };
    setFormState(optimisticState);
    setIsSaving(true);
    setErrorMessage(null);
    const previousThemePreference = formState.theme;
    if (sanitized.theme) {
      applyThemePreference(sanitized.theme);
    }

    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitized),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Unable to save settings.');
      }
      if (payload?.data) {
        setFormState(payload.data);
        mutate(payload.data, false);
      }
      toast.success('Settings saved');
    } catch (error) {
      if (sanitized.theme) {
        applyThemePreference(previousThemePreference);
      }
      setFormState(previousState);
      const message = error instanceof Error ? error.message : 'Unable to save settings.';
      setErrorMessage(message);
      toast.error('Unable to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = (value: string) => {
    if (value === 'system' || value === 'dark' || value === 'light') {
      void updateSetting({ theme: value });
    }
  };

  const handleToggle = (key: keyof UserSettingsValue, value: boolean) => {
    void updateSetting({ [key]: value });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleReset = () => {
    void updateSetting(USER_SETTINGS_DEFAULTS);
  };

  const { social_enabled, community_activity_enabled, community_suggestions_enabled } = formState;

  return (
    <div className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertTitle>Couldn&rsquo;t save settings</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Set a theme that feels right for your workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={formState.theme} onValueChange={handleThemeChange}>
            <TabsList className="max-w-xs">
              <TabsTrigger value="system" disabled={isSaving}>
                System
              </TabsTrigger>
              <TabsTrigger value="dark" disabled={isSaving}>
                Dark
              </TabsTrigger>
              <TabsTrigger value="light" disabled={isSaving}>
                Light
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-sm text-muted-foreground">
            Theme selections are synced across devices and saved instantly.
          </p>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Changes are saved automatically. A toast confirms the update.
          </p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Layer</CardTitle>
          <CardDescription>Social is optional—opt in whenever you want.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Enable social features</p>
              <p className="text-xs text-muted-foreground">
                Extend Hobbistas with community activity, recommendations, and shared discovery.
              </p>
            </div>
            <Switch
              checked={social_enabled}
              onCheckedChange={checked => handleToggle('social_enabled', checked)}
              disabled={isSaving}
            />
          </div>

          {!social_enabled && (
            <p className="text-sm text-muted-foreground">
              Your space stays private and personal until you enable the social layer.
            </p>
          )}

          {social_enabled && (
            <div className="space-y-4 rounded-xl border border-dashed border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Show community activity feed</p>
                  <p className="text-xs text-muted-foreground">
                    Live updates from the community while you keep your own streaks private.
                  </p>
                </div>
                <Switch
                  checked={community_activity_enabled}
                  onCheckedChange={checked => handleToggle('community_activity_enabled', checked)}
                  disabled={isSaving}
                />
              </div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Show community suggestions</p>
                  <p className="text-xs text-muted-foreground">
                    Get curated recommendations inspired by what everyone is enjoying.
                  </p>
                </div>
                <Switch
                  checked={community_suggestions_enabled}
                  onCheckedChange={checked =>
                    handleToggle('community_suggestions_enabled', checked)
                  }
                  disabled={isSaving}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
          <CardDescription>Pick the streams you want to surface in your hub.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Enable Articles</p>
              <p className="text-xs text-muted-foreground">
                Keep the latest write-ups and editorial features on your dashboard.
              </p>
            </div>
            <Switch
              checked={formState.articles_enabled}
              onCheckedChange={checked => handleToggle('articles_enabled', checked)}
              disabled={isSaving}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Enable Reviews</p>
              <p className="text-xs text-muted-foreground">
                Show community ratings and mini-reviews as part of your feed.
              </p>
            </div>
            <Switch
              checked={formState.reviews_enabled}
              onCheckedChange={checked => handleToggle('reviews_enabled', checked)}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>Reset every setting back to the defaults.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Resets theme, content toggles, and the optional social layer. No account changes occur.
          </p>
        </CardContent>
        <CardFooter>
          {isMounted && (
            <AlertDialog open={isResetDialogOpen} onOpenChange={setResetDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={isSaving} className="w-full">
                  Reset settings to default
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset to defaults?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will revert every preference to the default state. You can redo these steps
                    anytime.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={handleReset}
                    disabled={isSaving}
                  >
                    Reset settings
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
