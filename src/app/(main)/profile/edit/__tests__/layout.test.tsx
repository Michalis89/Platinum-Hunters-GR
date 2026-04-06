import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/utils/seo/metadata/helpers', () => ({
  buildMetadata: jest.fn(() => ({ title: 'Edit Profile' })),
}));

import ProfileEditLayout from '../layout';

describe('ProfileEditLayout', () => {
  it('renders children', () => {
    render(
      <ProfileEditLayout>
        <div>test child content</div>
      </ProfileEditLayout>,
    );
    expect(screen.getByText('test child content')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <ProfileEditLayout>
        <span>child one</span>
        <span>child two</span>
      </ProfileEditLayout>,
    );
    expect(screen.getByText('child one')).toBeInTheDocument();
    expect(screen.getByText('child two')).toBeInTheDocument();
  });
});
