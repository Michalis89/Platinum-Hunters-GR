import { render, screen } from '@testing-library/react';
import ProfileLayout, { metadata } from '@/app/(main)/profile/layout';

describe('ProfileLayout', () => {
  it('exports expected metadata', () => {
    expect(metadata).toMatchObject({
      title: 'Profile',
      description: 'Manage your profile and personal account details.',
      robots: {
        index: false,
        follow: false,
      },
    });
  });

  it('renders children as-is', () => {
    render(
      <ProfileLayout>
        <div>Profile content</div>
      </ProfileLayout>,
    );

    expect(screen.getByText('Profile content')).toBeInTheDocument();
  });
});
