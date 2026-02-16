'use client';

import {
  User,
  Mail,
  Calendar,
  MapPin,
  Globe2,
  MessageCircle,
  Instagram,
  Youtube,
  Twitch,
  Twitter,
  Link2,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import EmptyState from '@/components/ui/empty';
import type { User as UserType } from '@/types/user';

type ProfilePersonalInfoProps = {
  user: UserType;
  interestsSection?: ReactNode;
};

function normalizeSocialUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function decodePathname(pathname: string) {
  if (!pathname || pathname === '/') return '';
  const segments = pathname
    .split('/')
    .map(segment => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .filter(Boolean);
  return segments.join('/');
}

function getSocialDisplayValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const normalized = normalizeSocialUrl(trimmed);
  try {
    const url = new URL(normalized);
    const host = url.hostname.replace(/^www\./i, '');
    const decodedPath = decodePathname(url.pathname);
    return decodedPath ? `${host}/${decodedPath}` : host;
  } catch {
    try {
      return decodeURIComponent(trimmed);
    } catch {
      return trimmed;
    }
  }
}

const socialPlatforms = [
  { key: 'discord', label: 'Discord', icon: <MessageCircle className="h-4 w-4" /> },
  { key: 'instagram', label: 'Instagram', icon: <Instagram className="h-4 w-4" /> },
  { key: 'youtube', label: 'YouTube', icon: <Youtube className="h-4 w-4" /> },
  { key: 'twitch', label: 'Twitch', icon: <Twitch className="h-4 w-4" /> },
  { key: 'twitter', label: 'X / Twitter', icon: <Twitter className="h-4 w-4" /> },
  { key: 'reddit', label: 'Reddit', icon: <Link2 className="h-4 w-4" /> },
  { key: 'website', label: 'Website', icon: <Globe2 className="h-4 w-4" /> },
];

function calculateAge(dateOfBirth?: string | null) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export function ProfilePersonalInfo({
  user,
  interestsSection,
}: Readonly<ProfilePersonalInfoProps>) {
  const privacy = (user.privacy_settings as unknown as Record<string, unknown>) || {};
  const showAge = (privacy.show_age as boolean) ?? false;
  const showSocial = (privacy.show_social_links as boolean) ?? true;
  const showLocation = (privacy.show_location as boolean) ?? true;
  const socialLinks = (user.social_links as Record<string, unknown>) || {};
  const locationCity = (socialLinks.location_city as string) || '';
  const [age, setAge] = useState<number | null>(null);

  useEffect(() => {
    setAge(calculateAge(user.date_of_birth));
  }, [user.date_of_birth]);

  const visibleSocialLinks = socialPlatforms.filter(p =>
    (socialLinks[p.key] as string | undefined)?.trim(),
  );

  return (
    <section className="px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center md:mb-10">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Profile
          </p>
          <h2 className="text-2xl font-semibold md:text-3xl">About</h2>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-6">
          <div className="mb-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-card/70">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="break-words text-sm font-medium text-foreground">
                  {user.full_name || '�'}
                </p>
              </div>
            </div>

            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-card/70">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Display Name</p>
                <p className="break-words text-sm font-medium text-foreground">
                  {user.display_name || user.username}
                </p>
              </div>
            </div>

            {showAge && (
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-card/70">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Age</p>
                  <p
                    className="break-words text-sm font-medium text-foreground"
                    suppressHydrationWarning
                  >
                    {age ? `${age} years old` : '�'}
                  </p>
                </div>
              </div>
            )}

            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-card/70">
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="break-words text-sm font-medium text-foreground">
                  {showLocation
                    ? [locationCity, user.country].filter(Boolean).join(', ') || '�'
                    : 'Hidden'}
                </p>
              </div>
            </div>

            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-card/70">
                <Globe2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Time Zone</p>
                <p className="break-words text-sm font-medium text-foreground">
                  {showLocation ? user.timezone || '�' : 'Hidden'}
                </p>
              </div>
            </div>
          </div>

          {showSocial && (
            <div className="border-t border-border/40 pt-6">
              <p className="mb-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Social Presence
              </p>

              {visibleSocialLinks.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {visibleSocialLinks.map(platform => {
                    const value = (socialLinks[platform.key] as string) || '';
                    return (
                      <a
                        key={platform.key}
                        href={normalizeSocialUrl(value)}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-3 rounded-[14px] border border-border/60 bg-card/50 p-3 transition-colors hover:border-border"
                      >
                        <span className="text-muted-foreground transition-colors">
                          {platform.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">{platform.label}</p>
                          <p className="break-all text-sm text-foreground sm:truncate">
                            {getSocialDisplayValue(value)}
                          </p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="No social links yet." size="sm" />
              )}
            </div>
          )}

          {interestsSection && (
            <div className="mt-6 border-t border-border/40 pt-6">
              <p className="mb-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Categories & Interests
              </p>
              {interestsSection}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
