import Link from 'next/link';
import { buildMetadata } from '@/utils/seo/metadata/helpers';
import StructuredData from '@/utils/seo/StructuredData';
import { getBreadcrumbStructuredData } from '@/utils/seo/metadata/structuredData';
import { SITE_CONTACT_EMAIL, SITE_NAME, SITE_URL } from '@/config/site';
import { PageContainer, PageHeader } from '@/app/components/layout';

export const metadata = buildMetadata({
  title: 'Privacy Policy | Hobbistas',
  description: 'Learn how Hobbistas collects and protects your data.',
  path: '/privacy',
});

export default function PrivacyPage() {
  const breadcrumb = [
    { name: 'Home', url: `${SITE_URL}/` },
    { name: 'Privacy Policy', url: `${SITE_URL}/privacy` },
  ];

  return (
    <>
      <StructuredData data={getBreadcrumbStructuredData(breadcrumb)} />
      <PageContainer size="sm" className="py-12">
        <div className="flex flex-col gap-6">
          {/* Header / Hero */}
          <section className="rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <PageHeader
              eyebrow={`${SITE_NAME} • Data Protection`}
              title="Privacy Policy"
              description={
                <>
                  This Privacy Policy explains how{' '}
                  <span className="font-semibold text-[var(--hb-primary-strong)]">{SITE_NAME}</span>{' '}
                  collects, stores, and processes your personal data when you use the website{' '}
                  <a
                    href={SITE_URL}
                    className="font-medium text-[var(--hb-primary-strong)] underline-offset-2 hover:underline"
                  >
                    {SITE_URL.replace('https://', '')}
                  </a>{' '}
                  and its related services. Processing is conducted in accordance with the General
                  Data Protection Regulation (GDPR) and applicable Greek law.
                </>
              }
              meta={`Last updated: ${new Date().getFullYear()}`}
              align="left"
              contentClassName="items-start"
              titleClassName="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl"
              eyebrowClassName="tracking-[0.25em] text-[var(--hb-muted)]"
              descriptionClassName="text-sm leading-relaxed text-[var(--hb-text)] md:text-base"
              metaClassName="text-xs text-[var(--hb-muted)] opacity-70"
            />
          </section>

          {/* Content */}
          <section className="rounded-3xl border border-[var(--hb-border)] bg-[var(--hb-panel)] p-6 text-sm leading-relaxed text-[var(--hb-text)] shadow-xl backdrop-blur-md md:p-8 md:text-base">
            <div className="space-y-6">
              {/* 1. Data Controller */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  1. Data Controller
                </h2>
                <p>
                  The data controller for data collected through the Service is the creator of{' '}
                  <span className="font-semibold text-[var(--hb-primary-strong)]">{SITE_NAME}</span>.
                  For matters concerning the protection of personal data, you may contact us at:
                </p>
                <p className="mt-1 font-medium text-[var(--hb-primary-strong)]">
                  {SITE_CONTACT_EMAIL}
                </p>
              </section>

              {/* 2. What Data We Collect */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  2. What Data We Collect
                </h2>
                <p>
                  Depending on your use of the Service, we may collect the following categories of
                  data:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    <span className="font-semibold">Account information:</span> email address,
                    username, encrypted password, account creation date.
                  </li>
                  <li>
                    <span className="font-semibold">Profile information (optional):</span> display
                    name, full name, country, bio, platform IDs (PSN, Xbox, Steam), favorite genres,
                    favorite platform, gaming start year.
                  </li>
                  <li>
                    <span className="font-semibold">Usage data:</span> profile settings, backlog
                    entries, game status, playtime hours you enter, articles you create or edit.
                  </li>
                  <li>
                    <span className="font-semibold">Technical information:</span> IP address, browser
                    type, approximate device type, basic logs for security and debugging purposes.
                  </li>
                  <li>
                    <span className="font-semibold">Cookies &amp; similar technologies:</span>{' '}
                    authentication cookies and session tokens via Supabase, and any strictly
                    necessary cookies for platform functionality.
                  </li>
                </ul>
                <p className="mt-2 text-xs text-[var(--hb-muted)]">
                  We do not intentionally collect sensitive personal data (e.g., health information,
                  political opinions, etc.).
                </p>
              </section>

              {/* 3. Processing Purposes */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  3. Processing Purposes &amp; Legal Basis
                </h2>
                <p>We use your data for the following purposes:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    <span className="font-semibold">Account creation and management:</span> to allow
                    you to log in, save your backlog, manage your profile, etc. (legal basis:
                    performance of contract).
                  </li>
                  <li>
                    <span className="font-semibold">Security &amp; protection:</span> to prevent
                    abuse, malicious activity, and unauthorized access (legal basis: legitimate
                    interest).
                  </li>
                  <li>
                    <span className="font-semibold">Communication with you:</span> for email
                    verification, password reset, and account-related notifications (legal basis:
                    performance of contract / compliance with user requests).
                  </li>
                  <li>
                    <span className="font-semibold">Service improvement:</span> basic usage analysis,
                    statistics, and feedback (legal basis: legitimate interest). We do not conduct
                    profiling or advertising targeting.
                  </li>
                </ul>
              </section>

              {/* 4. Where Data is Stored */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  4. Where Your Data is Stored
                </h2>
                <p>
                  Your data is primarily stored on infrastructure provided by{' '}
                  <span className="font-semibold">Supabase</span> (database, authentication), as well
                  as hosting infrastructure used to operate{' '}
                  <span className="font-semibold text-[var(--hb-primary-strong)]">{SITE_NAME}</span>.
                </p>
                <p className="mt-2">
                  These providers act as data processors on our behalf, under contractual terms and
                  security policies. We make reasonable efforts to host data within the EU where
                  feasible.
                </p>
              </section>

              {/* 5. Data Retention */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  5. Data Retention Period
                </h2>
                <p>Your data is retained for as long as:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>you maintain an active account on the Service,</li>
                  <li>it is necessary to provide the features you use,</li>
                  <li>or it is required by applicable law.</li>
                </ul>
                <p className="mt-2">
                  When you delete your account, we make reasonable efforts to delete or anonymize
                  personal data that identifies you, unless legal or technical obligations require
                  longer retention (e.g., security logs).
                </p>
              </section>

              {/* 6. Cookies */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  6. Cookies &amp; Similar Technologies
                </h2>
                <p>The Service uses cookies primarily for:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>authentication (login / staying logged in),</li>
                  <li>basic technical functionality (e.g., preferences, session management),</li>
                  <li>potentially basic statistical traffic analysis (if enabled).</li>
                </ul>
                <p className="mt-2">
                  You may configure your browser to block or delete cookies, but this may affect the
                  functionality of the Service (e.g., automatic logout).
                </p>
              </section>

              {/* 7. Data Sharing */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  7. Data Sharing with Third Parties
                </h2>
                <p>
                  We do not sell, rent, or trade your personal data. Data may be shared:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    with infrastructure providers (such as Supabase) who act as data processors,
                  </li>
                  <li>
                    with competent authorities when required by law or in response to legal process,
                  </li>
                  <li>
                    if deemed necessary to protect rights, the security of the Service, or other
                    users.
                  </li>
                </ul>
              </section>

              {/* 8. Your Rights */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  8. Your Rights under GDPR
                </h2>
                <p>You have the following rights regarding your personal data:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>right of access to your data,</li>
                  <li>right to rectification of inaccurate or incomplete data,</li>
                  <li>right to erasure (&quot;right to be forgotten&quot;) under certain conditions,</li>
                  <li>right to restriction of processing,</li>
                  <li>right to data portability,</li>
                  <li>right to object to certain forms of processing.</li>
                </ul>
                <p className="mt-2">
                  To exercise your rights, you may contact us at{' '}
                  <span className="font-medium text-[var(--hb-primary-strong)]">
                    {SITE_CONTACT_EMAIL}
                  </span>
                  . We will respond within a reasonable timeframe and in accordance with applicable
                  legal frameworks.
                </p>
                <p className="mt-2 text-xs text-[var(--hb-muted)]">
                  You also have the right to lodge a complaint with the competent supervisory
                  authority (Hellenic Data Protection Authority – www.dpa.gr) if you believe the
                  processing of your data violates the law.
                </p>
              </section>

              {/* 9. Security */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  9. Information Security
                </h2>
                <p>
                  We implement reasonable technical and organizational measures to protect your data
                  from unauthorized access, loss, or alteration. However, no online service can
                  guarantee absolute security.
                </p>
              </section>

              {/* 9.1 Password Security */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  9.1 Password Security
                </h2>
                <p>
                  User passwords are never stored in human-readable form. Authentication is handled
                  via Supabase, which uses modern encryption techniques (hashed &amp; salted) in
                  accordance with current security standards.
                </p>
                <p className="mt-2">
                  As a result, neither{' '}
                  <span className="font-semibold text-[var(--hb-primary-strong)]">{SITE_NAME}</span>
                  {' '}nor its administrators have access to actual passwords. In case of password loss,
                  recovery is performed exclusively through secure email verification links.
                </p>
              </section>

              {/* 10. Changes to Policy */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  10. Changes to this Privacy Policy
                </h2>
                <p>
                  This Policy may be updated periodically to reflect changes to the Service,
                  providers, or legal frameworks. The updated version will be published on the
                  website and, where appropriate, you may receive notification.
                </p>
              </section>

              {/* 11. Relationship with Terms */}
              <section>
                <h2 className="mb-2 text-lg font-semibold text-[var(--hb-headline)]">
                  11. Relationship with Terms of Service
                </h2>
                <p>
                  This Privacy Policy supplements our{' '}
                  <Link
                    href="/terms"
                    className="font-medium text-[var(--hb-primary-strong)] underline-offset-2 hover:underline"
                  >
                    Terms of Service
                  </Link>
                  . In case of any conflict, the provisions that better protect your rights as a data
                  subject shall prevail.
                </p>
              </section>

              <p className="pt-4 text-xs text-[var(--hb-muted)] opacity-70">
                This text is provided in plain language and may be further adapted with specialized
                legal counsel as the Service evolves.
              </p>
            </div>
          </section>
        </div>
      </PageContainer>
    </>
  );
}
