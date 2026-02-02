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
import EmptyState from '@/app/components/ui/EmptyState';
import type { User as UserType } from '@/types/user';
import { useEffect, useState } from 'react';

type ProfilePersonalInfoProps = {
  user: UserType;
};

function normalizeSocialUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
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

export function ProfilePersonalInfo({ user }: Readonly<ProfilePersonalInfoProps>) {
  const privacy = (user.privacy_settings as unknown as Record<string, unknown>) || {};
  const showAge = (privacy.show_age as boolean) ?? false;
  const showSocial = (privacy.show_social_links as boolean) ?? true;
  const showLocation = (privacy.show_location as boolean) ?? true;
  const socialLinks = (user.social_links as Record<string, unknown>) || {};
  const locationCity = (socialLinks.location_city as string) || '';
  const [age, setAge] = useState<number | null>(() => calculateAge(user.date_of_birth));

  useEffect(() => {
    setAge(calculateAge(user.date_of_birth));
  }, [user.date_of_birth]);
  const visibleSocialLinks = socialPlatforms.filter(p =>
    (socialLinks[p.key] as string | undefined)?.trim(),
  );

  return (
    <section className="px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--hb-primary-strong)]">
            Προφίλ
          </p>
          <h2 className="text-2xl font-bold text-[var(--hb-headline)] md:text-3xl">
            Προσωπικές Πληροφορίες
          </h2>
        </div>

        <div className="rounded-2xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 shadow-[var(--hb-shadow-md)]">
          {/* Info Grid */}
          <div className="mb-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Full name */}
            <div className="flex items-start gap-3">
              <div className="bg-[var(--hb-primary-strong)]/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
                <User className="h-5 w-5 text-[var(--hb-primary-strong)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--hb-muted)]">Ονοματεπώνυμο</p>
                <p className="text-sm font-medium text-[var(--hb-headline)]">
                  {user.full_name || '—'}
                </p>
              </div>
            </div>

            {/* Display name */}
            <div className="flex items-start gap-3">
              <div className="bg-[var(--hb-primary-strong)]/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
                <Mail className="h-5 w-5 text-[var(--hb-primary-strong)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--hb-muted)]">Display / Username</p>
                <p className="text-sm font-medium text-[var(--hb-headline)]">
                  {user.display_name || user.username}
                </p>
              </div>
            </div>

            {/* Age (if visible) */}
            {showAge && (
              <div className="flex items-start gap-3">
                <div className="bg-[var(--hb-primary-strong)]/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
                  <Calendar className="h-5 w-5 text-[var(--hb-primary-strong)]" />
                </div>
                <div>
                  <p className="text-xs text-[var(--hb-muted)]">Ηλικία</p>
                  <p className="text-sm font-medium text-[var(--hb-headline)]">
                    {age ? `${age} ετών` : '—'}
                  </p>
                </div>
              </div>
            )}

            {/* Location */}
            <div className="flex items-start gap-3">
              <div className="bg-[var(--hb-primary-strong)]/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
                <MapPin className="h-5 w-5 text-[var(--hb-primary-strong)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--hb-muted)]">Τοποθεσία</p>
                <p className="text-sm font-medium text-[var(--hb-headline)]">
                  {showLocation
                    ? [locationCity, user.country].filter(Boolean).join(', ') || '—'
                    : 'Κρυφό'}
                </p>
              </div>
            </div>

            {/* Timezone */}
            <div className="flex items-start gap-3">
              <div className="bg-[var(--hb-primary-strong)]/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
                <Globe2 className="h-5 w-5 text-[var(--hb-primary-strong)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--hb-muted)]">Ζώνη Ώρας</p>
                <p className="text-sm font-medium text-[var(--hb-headline)]">
                  {showLocation ? user.timezone || '—' : 'Κρυφό'}
                </p>
              </div>
            </div>
          </div>

          {/* Social Links */}
          {showSocial && (
            <div className="border-t border-[var(--hb-border)] pt-6">
              <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--hb-muted)]">
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
                        className="hover:border-[var(--hb-primary-strong)]/40 group flex items-center gap-3 rounded-xl border border-[var(--hb-border)] bg-[var(--hb-card)] p-3 transition-all hover:-translate-y-0.5"
                      >
                        <span className="text-[var(--hb-primary-strong)] transition-colors group-hover:text-[var(--hb-accent)]">
                          {platform.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-[var(--hb-muted)]">{platform.label}</p>
                          <p className="truncate text-sm text-[var(--hb-headline)] transition-colors group-hover:text-[var(--hb-primary-strong)]">
                            {value}
                          </p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="Δεν υπάρχουν social links." size="sm" />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
