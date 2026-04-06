import Breadcrumbs from '@/components/ui/breadcrumbs';

export function ProfilePageHeader() {
  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Profile', href: '/profile' },
          { label: 'Edit Profile' },
        ]}
        className="mb-2"
      />

      {/* Hero-style Header */}
      <section className="mb-4 text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-primary">
          Account - Profile Settings
        </p>
        <h1 className="mb-2 text-3xl font-semibold leading-tight md:text-4xl">
          <span className="text-foreground">Edit Profile</span>
        </h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground">
          Manage your account details, hobbies, and privacy settings.
        </p>
      </section>
    </>
  );
}
