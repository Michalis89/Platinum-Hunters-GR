import { render, screen } from '@testing-library/react';
import AdminLayout, { metadata } from '@/app/(main)/admin/layout';

describe('AdminLayout', () => {
  it('exports expected metadata', () => {
    expect(metadata).toMatchObject({
      title: 'Admin',
      description: 'Administrative controls for Hobbistas operations.',
      robots: {
        index: false,
        follow: false,
      },
    });
  });

  it('renders children as-is', () => {
    render(
      <AdminLayout>
        <div>Admin content</div>
      </AdminLayout>,
    );

    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });
});
