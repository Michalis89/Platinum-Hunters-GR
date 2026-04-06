import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    type,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: string;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      type={type as 'submit' | 'button'}
      className={className}
    >
      {children}
    </button>
  ),
}));

import { SaveButtons } from '../save-buttons';

describe('SaveButtons', () => {
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockOnCancel.mockClear();
  });

  it('renders Save and Cancel buttons', () => {
    render(<SaveButtons saving={false} isDirty={true} onCancel={mockOnCancel} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('enables Save button when isDirty and not saving', () => {
    render(<SaveButtons saving={false} isDirty={true} onCancel={mockOnCancel} />);
    const saveBtn = screen.getByText('Save').closest('button');
    expect(saveBtn).not.toBeDisabled();
  });

  it('disables Save button when not dirty', () => {
    render(<SaveButtons saving={false} isDirty={false} onCancel={mockOnCancel} />);
    const saveBtn = screen.getByText('Save').closest('button');
    expect(saveBtn).toBeDisabled();
  });

  it('disables Save button while saving', () => {
    render(<SaveButtons saving={true} isDirty={true} onCancel={mockOnCancel} />);
    const saveBtn = screen.getByText('Saving...').closest('button');
    expect(saveBtn).toBeDisabled();
  });

  it('shows "Saving..." text when saving', () => {
    render(<SaveButtons saving={true} isDirty={true} onCancel={mockOnCancel} />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('disables Cancel button while saving', () => {
    render(<SaveButtons saving={true} isDirty={true} onCancel={mockOnCancel} />);
    const cancelBtn = screen.getByText('Cancel').closest('button');
    expect(cancelBtn).toBeDisabled();
  });

  it('calls onCancel when Cancel is clicked', () => {
    render(<SaveButtons saving={false} isDirty={true} onCancel={mockOnCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('Save button has type="submit"', () => {
    render(<SaveButtons saving={false} isDirty={true} onCancel={mockOnCancel} />);
    const saveBtn = screen.getByText('Save').closest('button');
    expect(saveBtn).toHaveAttribute('type', 'submit');
  });
});
