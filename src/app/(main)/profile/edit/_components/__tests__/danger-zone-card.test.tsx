import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-title" className={className}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({
    value,
    onChange,
    placeholder,
    disabled,
    type,
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    disabled?: boolean;
    type?: string;
  }) => (
    <input
      data-testid="delete-input"
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    className?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} className={className}>
      {children}
    </button>
  ),
}));

import { DangerZoneCard } from '../danger-zone-card';

const defaultProps = {
  showDeleteConfirm: false,
  deleteConfirmText: '',
  deleting: false,
  onShowDeleteConfirm: jest.fn(),
  onCancelDelete: jest.fn(),
  onDeleteConfirmTextChange: jest.fn(),
  onDeleteAccount: jest.fn(),
};

describe('DangerZoneCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Danger Zone title', () => {
    render(<DangerZoneCard {...defaultProps} />);
    expect(screen.getByText('Danger Zone')).toBeInTheDocument();
  });

  it('renders warning content', () => {
    render(<DangerZoneCard {...defaultProps} />);
    expect(screen.getByText(/permanent/)).toBeInTheDocument();
  });

  it('renders the Delete Account button when showDeleteConfirm is false', () => {
    render(<DangerZoneCard {...defaultProps} showDeleteConfirm={false} />);
    expect(screen.getByText('Delete Account')).toBeInTheDocument();
    expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument();
  });

  it('calls onShowDeleteConfirm when Delete Account button is clicked', () => {
    const onShowDeleteConfirm = jest.fn();
    render(<DangerZoneCard {...defaultProps} onShowDeleteConfirm={onShowDeleteConfirm} />);
    fireEvent.click(screen.getByText('Delete Account'));
    expect(onShowDeleteConfirm).toHaveBeenCalledTimes(1);
  });

  it('renders the confirmation panel when showDeleteConfirm is true', () => {
    render(<DangerZoneCard {...defaultProps} showDeleteConfirm={true} />);
    expect(screen.getByText('Are you sure? This action cannot be undone.')).toBeInTheDocument();
    expect(screen.queryByText('Delete Account')).not.toBeInTheDocument();
  });

  it('renders input and buttons in confirmation panel', () => {
    render(<DangerZoneCard {...defaultProps} showDeleteConfirm={true} />);
    expect(screen.getByTestId('delete-input')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete Permanently')).toBeInTheDocument();
  });

  it('calls onCancelDelete when Cancel is clicked in confirm panel', () => {
    const onCancelDelete = jest.fn();
    render(
      <DangerZoneCard {...defaultProps} showDeleteConfirm={true} onCancelDelete={onCancelDelete} />,
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancelDelete).toHaveBeenCalledTimes(1);
  });

  it('calls onDeleteConfirmTextChange when input changes', () => {
    const onDeleteConfirmTextChange = jest.fn();
    render(
      <DangerZoneCard
        {...defaultProps}
        showDeleteConfirm={true}
        onDeleteConfirmTextChange={onDeleteConfirmTextChange}
      />,
    );
    fireEvent.change(screen.getByTestId('delete-input'), { target: { value: 'DELETE' } });
    expect(onDeleteConfirmTextChange).toHaveBeenCalledWith('DELETE');
  });

  it('calls onDeleteAccount when Delete Permanently is clicked', () => {
    const onDeleteAccount = jest.fn();
    render(
      <DangerZoneCard
        {...defaultProps}
        showDeleteConfirm={true}
        deleteConfirmText="DELETE"
        onDeleteAccount={onDeleteAccount}
      />,
    );
    fireEvent.click(screen.getByText('Delete Permanently'));
    expect(onDeleteAccount).toHaveBeenCalledTimes(1);
  });

  it('disables Delete Permanently button when deleteConfirmText !== DELETE', () => {
    render(<DangerZoneCard {...defaultProps} showDeleteConfirm={true} deleteConfirmText="wrong" />);
    const deleteBtn = screen.getByText('Delete Permanently').closest('button');
    expect(deleteBtn).toBeDisabled();
  });

  it('shows "Deleting..." when deleting is true', () => {
    render(
      <DangerZoneCard
        {...defaultProps}
        showDeleteConfirm={true}
        deleteConfirmText="DELETE"
        deleting={true}
      />,
    );
    expect(screen.getByText('Deleting...')).toBeInTheDocument();
  });

  it('disables input and buttons when deleting', () => {
    render(
      <DangerZoneCard
        {...defaultProps}
        showDeleteConfirm={true}
        deleteConfirmText="DELETE"
        deleting={true}
      />,
    );
    const input = screen.getByTestId('delete-input');
    expect(input).toBeDisabled();
    const cancelBtn = screen.getByText('Cancel').closest('button');
    expect(cancelBtn).toBeDisabled();
  });

  it('renders all bullet points in the warning list', () => {
    render(<DangerZoneCard {...defaultProps} />);
    expect(screen.getByText('All your personal data')).toBeInTheDocument();
    expect(screen.getByText('Your profile')).toBeInTheDocument();
    expect(screen.getByText('Your comments')).toBeInTheDocument();
    expect(screen.getByText('Your activity history')).toBeInTheDocument();
  });
});
