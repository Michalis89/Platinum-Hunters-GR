'use client';

import { Camera, Eye, EyeOff, Link2, MapPin, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SelectField as Select } from '@/components/ui/select-field';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AvatarImage } from '@/components/ui/avatar-image';
import { COUNTRIES } from '@/data/hobbyConstants';
import { SOCIAL_PLATFORMS, TIMEZONES } from '../_constants';
import type { ProfileFormData } from '../_types';
import type { User } from '@/types/user';

interface PersonalInfoCardProps {
  user: User;
  formData: ProfileFormData;
  socialLinks: Record<string, string>;
  locationCity: string;
  privacySettings: {
    show_age: boolean;
    show_social_links: boolean;
    show_location: boolean;
  };
  currentAvatar: string;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string) => (value: string) => void;
  onSocialLinkChange: (key: string, value: string) => void;
  onLocationCityChange: (city: string) => void;
  onPrivacyToggle: (key: 'show_age' | 'show_social_links' | 'show_location') => void;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarRemove: () => void;
}

export function PersonalInfoCard({
  user,
  formData,
  socialLinks,
  locationCity,
  privacySettings,
  currentAvatar,
  onFormChange,
  onSelectChange,
  onSocialLinkChange,
  onLocationCityChange,
  onPrivacyToggle,
  onAvatarUpload,
  onAvatarRemove,
}: PersonalInfoCardProps) {
  return (
    <Card className="">
      <CardHeader className="border-b border-border bg-card/50">
        <p className="mb-1 text-xs uppercase tracking-[0.25em] text-primary">Core Details</p>
        <CardTitle className="text-lg text-foreground">Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-card/88 rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Account Information</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Username" value={user.username} disabled />
            <Input
              label="Display Name"
              type="text"
              name="display_name"
              value={formData.display_name || ''}
              onChange={onFormChange}
              placeholder="The name visible to everyone"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Full Name"
            type="text"
            name="full_name"
            value={formData.full_name || ''}
            onChange={onFormChange}
            placeholder="John Doe"
          />

          <Input
            label="Date of Birth"
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth || ''}
            onChange={onFormChange}
          />
        </div>

        <div className="bg-card/88 rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Location Details</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              key={`country-${formData.country || 'none'}`}
              label="Country"
              options={COUNTRIES}
              value={(formData.country as string) || ''}
              onChange={onSelectChange('country')}
            />
            <Input
              label="City"
              type="text"
              name="city"
              value={locationCity}
              onChange={e => onLocationCityChange(e.target.value)}
              placeholder="e.g. Athens"
            />
            <Select
              key={`timezone-${formData.timezone || 'none'}`}
              label="Time Zone"
              options={TIMEZONES}
              value={(formData.timezone as string) || ''}
              onChange={onSelectChange('timezone')}
            />
          </div>
        </div>

        <div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Bio</label>
            <Textarea
              name="bio"
              value={formData.bio || ''}
              onChange={onFormChange}
              placeholder="Tell us a few words about yourself..."
              rows={4}
            />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {formData.bio?.length || 0} / 500 characters
          </div>
        </div>

        <div className="bg-card/88 rounded-lg border p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Link2 className="h-4 w-4 text-primary" />
              <span>Social Presence</span>
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              2 columns - with icons
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {SOCIAL_PLATFORMS.map(platform => {
              const Icon = platform.icon;
              return (
                <div key={platform.key} className="flex items-center gap-3 border bg-card/80 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border bg-muted text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {platform.label}
                    </p>
                    <input
                      type="text"
                      value={socialLinks[platform.key] || ''}
                      onChange={e => onSocialLinkChange(platform.key, e.target.value)}
                      placeholder={platform.placeholder}
                      className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="bg-card/88 rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Camera className="h-4 w-4 text-primary" />
              <span>Profile Photo</span>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border bg-card">
                {currentAvatar ? (
                  <AvatarImage
                    src={currentAvatar}
                    alt="Avatar"
                    size={80}
                    className="rounded-full"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    No avatar
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Avatar Upload
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onAvatarUpload}
                    className="block w-full text-xs text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:font-semibold file:uppercase file:tracking-wide file:text-background hover:file:opacity-90"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Auto-avatar generation: placeholder for a future release.
                  </p>
                </div>
                <Input
                  label="Avatar URL"
                  type="text"
                  name="avatar_url"
                  value={(formData.avatar_url as string) || ''}
                  onChange={onFormChange}
                  placeholder="https://..."
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onAvatarRemove}>
                    Remove
                  </Button>
                  <Button type="button" variant={'primary'} disabled>
                    Auto-avatar (soon)
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card/88 rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Privacy Settings</span>
            </div>
            <div className="space-y-3">
              {[
                { key: 'show_age', label: 'Show age' },
                { key: 'show_social_links', label: 'Show social links' },
                { key: 'show_location', label: 'Show country/city' },
              ].map(setting => {
                const active = (privacySettings as Record<string, boolean>)[setting.key];
                return (
                  <Button
                    type="button"
                    key={setting.key}
                    onClick={() =>
                      onPrivacyToggle(
                        setting.key as 'show_age' | 'show_social_links' | 'show_location',
                      )
                    }
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                      active
                        ? `bg-primary/12 dark:bg-primary/22 border-primary/30 text-primary dark:border-primary/55 dark:text-[#8ec5ff]`
                        : `hover:bg-primary/8 border-border bg-card text-foreground hover:border-primary/35`
                    }`}
                  >
                    <span className="text-sm font-medium">{setting.label}</span>
                    {active ? (
                      <Eye className="h-4 w-4 text-primary" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                );
              })}
              <p className="text-[11px] text-muted-foreground">
                Small settings that give you better control over your profile.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
