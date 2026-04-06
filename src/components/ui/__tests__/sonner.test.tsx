import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next-themes', () => ({
  __esModule: true,
  useTheme: jest.fn(),
}));

jest.mock('sonner', () => ({
  __esModule: true,
  Toaster: jest.fn((props: Record<string, unknown>) => (
    <div
      data-testid="sonner-toaster"
      data-theme={String(props.theme)}
      data-class-name={String(props.className)}
      data-has-toast-options={String(Boolean(props.toastOptions))}
      data-rich-colors={String(Boolean(props.richColors))}
    />
  )),
}));

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

describe('components/ui/sonner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the current theme from next-themes and forwards custom props', () => {
    (useTheme as jest.Mock).mockReturnValue({ theme: 'dark' });

    render(<Toaster richColors />);

    const toaster = screen.getByTestId('sonner-toaster');

    expect(toaster).toHaveAttribute('data-theme', 'dark');
    expect(toaster).toHaveAttribute('data-class-name', 'toaster group');
    expect(toaster).toHaveAttribute('data-has-toast-options', 'true');
    expect(toaster).toHaveAttribute('data-rich-colors', 'true');
    expect(Sonner).toHaveBeenCalledWith(
      expect.objectContaining({
        theme: 'dark',
        className: 'toaster group',
        richColors: true,
        toastOptions: expect.objectContaining({
          classNames: expect.objectContaining({
            toast: expect.stringContaining('group toast'),
            description: 'group-[.toast]:text-muted-foreground',
            actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
            cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          }),
        }),
      }),
      undefined,
    );
  });

  it('falls back to the system theme when next-themes returns no explicit theme', () => {
    (useTheme as jest.Mock).mockReturnValue({});

    render(<Toaster />);

    expect(screen.getByTestId('sonner-toaster')).toHaveAttribute('data-theme', 'system');
  });
});
