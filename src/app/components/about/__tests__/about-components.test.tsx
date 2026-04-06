import { render, screen } from '@testing-library/react';
import { AboutFAQ } from '@/app/components/about/AboutFAQ';
import { AboutFeatures } from '@/app/components/about/AboutFeatures';
import { AboutFinalCTA } from '@/app/components/about/AboutFinalCTA';
import { AboutHero } from '@/app/components/about/AboutHero';
import { AboutHowItWorks } from '@/app/components/about/AboutHowItWorks';
import { AboutPeople } from '@/app/components/about/AboutPeople';
import { AboutPhilosophy } from '@/app/components/about/AboutPhilosophy';
import { AboutRoadmap } from '@/app/components/about/AboutRoadmap';
import { AboutStats } from '@/app/components/about/AboutStats';
import type { TeamMember } from '@/app/components/about/AboutPeople';
import * as AboutIndex from '@/app/components/about';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock('@/app/components/shared/PageHero', () => ({
  __esModule: true,
  default: ({
    eyebrow,
    subtitle,
    actions,
    badges,
    title,
  }: {
    eyebrow: string;
    subtitle: string;
    actions: React.ReactNode;
    badges: React.ReactNode;
    title: React.ReactNode;
  }) => (
    <section data-testid="page-hero">
      <div>{eyebrow}</div>
      <div>{subtitle}</div>
      <div>{title}</div>
      <div>{actions}</div>
      <div>{badges}</div>
    </section>
  ),
}));

jest.mock('@/components/ui/accordion', () => ({
  Accordion: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="accordion">{children}</div>
  ),
  AccordionItem: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="accordion-item">{children}</div>
  ),
  AccordionTrigger: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
  AccordionContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/avatar-image', () => ({
  AvatarImage: ({ alt }: { alt: string }) => <span data-testid="avatar-image" aria-label={alt} />,
}));

jest.mock('@/components/ui/empty', () => ({
  __esModule: true,
  default: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="empty-state">
      <p>{title}</p>
      <p>{description}</p>
    </div>
  ),
}));

jest.mock('@/config/roadmap', () => ({
  ROADMAP_ITEMS: [
    {
      title: 'Item done',
      description: 'Done desc',
      status: 'done',
      icon: () => <svg data-testid="road-icon-done" />,
    },
    {
      title: 'Item in-progress',
      description: 'In progress desc',
      status: 'in-progress',
      icon: () => <svg data-testid="road-icon-progress" />,
    },
    {
      title: 'Item planned',
      description: 'Planned desc',
      status: 'planned',
      icon: () => <svg data-testid="road-icon-planned" />,
    },
  ],
  getStatusLabel: (status: string) => `status:${status}`,
}));

describe('about components', () => {
  it('AboutHero renders guest and authenticated CTA variants', () => {
    const { rerender } = render(<AboutHero />);

    expect(screen.getByTestId('page-hero')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start for free/i })).toHaveAttribute(
      'href',
      '/auth/register',
    );
    expect(screen.getByRole('link', { name: /browse the categories/i })).toHaveAttribute(
      'href',
      '/hobbies',
    );

    rerender(<AboutHero isAuthenticated />);
    expect(screen.getByRole('link', { name: /go to dashboard/i })).toHaveAttribute(
      'href',
      '/dashboard',
    );
  });

  it('AboutFinalCTA renders guest and authenticated CTA variants', () => {
    const { rerender } = render(<AboutFinalCTA />);
    expect(screen.getByRole('link', { name: /create an account/i })).toHaveAttribute(
      'href',
      '/auth/register',
    );
    expect(screen.getByRole('link', { name: /contact us/i })).toHaveAttribute('href', '#');

    rerender(<AboutFinalCTA isAuthenticated />);
    expect(screen.getByRole('link', { name: /go to dashboard/i })).toHaveAttribute(
      'href',
      '/dashboard',
    );
  });

  it('AboutFAQ renders all FAQ items', () => {
    render(<AboutFAQ />);
    expect(screen.getByText('Frequently asked questions')).toBeInTheDocument();
    expect(screen.getAllByTestId('accordion-item')).toHaveLength(6);
    expect(screen.getByText('Is Hobbistas free?')).toBeInTheDocument();
    expect(screen.getByText(/How can I contribute or suggest features/i)).toBeInTheDocument();
  });

  it('AboutFeatures, AboutHowItWorks and AboutPhilosophy render their sections', () => {
    render(
      <>
        <AboutFeatures />
        <AboutHowItWorks />
        <AboutPhilosophy />
      </>,
    );

    expect(screen.getByText('Core features available today')).toBeInTheDocument();
    expect(screen.getByText('Personal Library')).toBeInTheDocument();
    expect(screen.getByText('External Library Sync')).toBeInTheDocument();

    expect(screen.getByText('What Hobbistas is not')).toBeInTheDocument();
    expect(screen.getByText('Not a social network')).toBeInTheDocument();
    expect(screen.getByText('Not an algorithm')).toBeInTheDocument();

    expect(screen.getByText('Why Hobbistas exists')).toBeInTheDocument();
    expect(screen.getByText('Simplicity')).toBeInTheDocument();
    expect(screen.getByText('Privacy & Control')).toBeInTheDocument();
  });

  it('AboutStats uses active stats when at least four non-zero values exist', () => {
    render(
      <AboutStats
        totalUsers={120}
        totalGames={10}
        totalAnime={20}
        totalManga={0}
        totalMovies={30}
        totalTv={0}
        totalBooks={40}
        totalArticles={50}
      />,
    );

    expect(screen.getByText('Content in numbers')).toBeInTheDocument();
    expect(screen.getByText('Games')).toBeInTheDocument();
    expect(screen.getByText('Articles')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.queryByText('Series')).not.toBeInTheDocument();
  });

  it('AboutStats falls back to first six stats when active stats are fewer than four', () => {
    render(
      <AboutStats
        totalUsers={0}
        totalGames={0}
        totalAnime={0}
        totalManga={0}
        totalMovies={0}
        totalTv={0}
        totalBooks={0}
        totalArticles={0}
      />,
    );

    expect(screen.getByText('Games')).toBeInTheDocument();
    expect(screen.getByText('Anime')).toBeInTheDocument();
    expect(screen.getByText('Manga')).toBeInTheDocument();
    expect(screen.getByText('Movies')).toBeInTheDocument();
    expect(screen.getByText('Series')).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();
    expect(screen.queryByText('Articles')).not.toBeInTheDocument();
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });

  it('AboutPeople renders empty state when team is empty', () => {
    render(<AboutPeople team={[]} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('No team members found.')).toBeInTheDocument();
  });

  it('AboutPeople sorts team, resolves role labels and renders avatar/fallback', () => {
    const team: TeamMember[] = [
      {
        id: '3',
        username: 'charlie',
        display_name: 'Charlie',
        roles: ['reviewer'],
        bio: null,
        avatar_url: null,
        country: null,
        favorite_platform: null,
      },
      {
        id: '1',
        username: 'alpha',
        display_name: 'Alpha',
        roles: ['owner'],
        bio: 'Founder',
        avatar_url: 'https://cdn/avatar.png',
        country: 'GR',
        favorite_platform: 'PC',
      },
      {
        id: '2',
        username: 'beta',
        display_name: null,
        roles: ['unknown-role'],
        bio: 'Bio',
        avatar_url: null,
        country: 'US',
        favorite_platform: 'PS5',
      },
    ];

    const { container } = render(<AboutPeople team={team} />);

    expect(screen.getByText('People behind Hobbista')).toBeInTheDocument();
    expect(screen.getAllByText('Founder').length).toBeGreaterThan(0);
    expect(screen.getByText('Reviewer')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-image')).toHaveAttribute('aria-label', 'Alpha');
    expect(screen.getByText('@alpha')).toBeInTheDocument();
    expect(screen.getByText('GR')).toBeInTheDocument();
    expect(screen.getByText('PC')).toBeInTheDocument();

    const text = container.textContent ?? '';
    expect(text.indexOf('Alpha')).toBeLessThan(text.indexOf('Charlie'));
    expect(text.indexOf('Charlie')).toBeLessThan(text.indexOf('beta'));
  });

  it('AboutPeople covers role-array guard, avatar alt fallback, and same-rank locale sorting', () => {
    type TeamMemberWithNullableRoles = Omit<TeamMember, 'roles'> & { roles: string[] | null };
    const team: TeamMemberWithNullableRoles[] = [
      {
        id: 'a2',
        username: 'zeta',
        display_name: null,
        roles: ['author'],
        bio: null,
        avatar_url: 'https://cdn/zeta.png',
        country: null,
        favorite_platform: null,
      },
      {
        id: 'a1',
        username: 'alpha',
        display_name: null,
        roles: ['author'],
        bio: null,
        avatar_url: null,
        country: null,
        favorite_platform: null,
      },
      {
        id: 'x1',
        username: 'guard',
        display_name: null,
        roles: null,
        bio: null,
        avatar_url: null,
        country: null,
        favorite_platform: null,
      },
    ];

    const { container } = render(<AboutPeople team={team as unknown as TeamMember[]} />);

    expect(screen.getByTestId('avatar-image')).toHaveAttribute('aria-label', 'zeta');
    expect(screen.getAllByText('Author').length).toBeGreaterThan(0);

    const text = container.textContent ?? '';
    expect(text.indexOf('alpha')).toBeLessThan(text.indexOf('zeta'));
    expect(text).toContain('guard');
  });

  it('AboutPeople covers defensive rank -1 fallback branch in sorter', () => {
    const originalIndexOf = Array.prototype.indexOf;
    const indexSpy = jest.spyOn(Array.prototype, 'indexOf').mockImplementation(function (
      this: unknown[],
      searchElement: unknown,
      fromIndex?: number,
    ) {
      if (
        this.length === 6 &&
        this[0] === 'owner' &&
        this[5] === 'user' &&
        searchElement === 'author'
      ) {
        return -1;
      }
      return originalIndexOf.call(this, searchElement as never, fromIndex as never);
    });

    const team: TeamMember[] = [
      {
        id: 'o',
        username: 'owner-user',
        display_name: 'Owner User',
        roles: ['owner'],
        bio: null,
        avatar_url: null,
        country: null,
        favorite_platform: null,
      },
      {
        id: 'a',
        username: 'author-user',
        display_name: 'Author User',
        roles: ['author'],
        bio: null,
        avatar_url: null,
        country: null,
        favorite_platform: null,
      },
    ];

    render(<AboutPeople team={team} />);
    expect(screen.getByText('Owner User')).toBeInTheDocument();
    expect(screen.getByText('Author User')).toBeInTheDocument();
    indexSpy.mockRestore();
  });

  it('AboutPeople covers defensive rankB -1 fallback branch in sorter', () => {
    const originalIndexOf = Array.prototype.indexOf;
    const indexSpy = jest.spyOn(Array.prototype, 'indexOf').mockImplementation(function (
      this: unknown[],
      searchElement: unknown,
      fromIndex?: number,
    ) {
      if (
        this.length === 6 &&
        this[0] === 'owner' &&
        this[5] === 'user' &&
        searchElement === 'owner'
      ) {
        return -1;
      }
      return originalIndexOf.call(this, searchElement as never, fromIndex as never);
    });

    const team: TeamMember[] = [
      {
        id: 'o',
        username: 'owner-user-b',
        display_name: 'Owner User B',
        roles: ['owner'],
        bio: null,
        avatar_url: null,
        country: null,
        favorite_platform: null,
      },
      {
        id: 'a',
        username: 'author-user-b',
        display_name: 'Author User B',
        roles: ['author'],
        bio: null,
        avatar_url: null,
        country: null,
        favorite_platform: null,
      },
    ];

    render(<AboutPeople team={team} />);
    expect(screen.getByText('Owner User B')).toBeInTheDocument();
    expect(screen.getByText('Author User B')).toBeInTheDocument();
    indexSpy.mockRestore();
  });

  it('AboutRoadmap renders roadmap cards and status labels', () => {
    render(<AboutRoadmap />);
    expect(screen.getByText('What is next')).toBeInTheDocument();
    expect(screen.getByText('Item done')).toBeInTheDocument();
    expect(screen.getByText('Item in-progress')).toBeInTheDocument();
    expect(screen.getByText('Item planned')).toBeInTheDocument();
    expect(screen.getByText('status:done')).toBeInTheDocument();
    expect(screen.getByText('status:in-progress')).toBeInTheDocument();
    expect(screen.getByText('status:planned')).toBeInTheDocument();
  });

  it('index.ts exports all public about modules', () => {
    expect(typeof AboutIndex.AboutHero).toBe('function');
    expect(typeof AboutIndex.AboutFeatures).toBe('function');
    expect(typeof AboutIndex.AboutHowItWorks).toBe('function');
    expect(typeof AboutIndex.AboutPhilosophy).toBe('function');
    expect(typeof AboutIndex.AboutStats).toBe('function');
    expect(typeof AboutIndex.AboutRoadmap).toBe('function');
    expect(typeof AboutIndex.AboutPeople).toBe('function');
    expect(typeof AboutIndex.AboutFAQ).toBe('function');
    expect(typeof AboutIndex.AboutFinalCTA).toBe('function');
  });
});
