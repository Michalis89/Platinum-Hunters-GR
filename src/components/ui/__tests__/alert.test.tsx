import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Alert, AlertDescription, AlertTitle, ErrorAlert } from '@/components/ui/alert';

describe('components/ui/alert', () => {
  it('renders Alert with role alert, default variant styles and merged className', () => {
    render(
      <Alert className="custom-alert" data-testid="alert-root">
        Base content
      </Alert>,
    );

    const alert = screen.getByTestId('alert-root');

    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert).toHaveTextContent('Base content');
    expect(alert.className).toContain('custom-alert');
    expect(alert.className).toContain('bg-background');
    expect(alert.className).toContain('text-foreground');
  });

  it('applies variant-specific classes on Alert', () => {
    const { rerender } = render(<Alert variant="destructive" data-testid="alert-root" />);

    let alert = screen.getByTestId('alert-root');
    expect(alert.className).toContain('text-destructive');

    rerender(<Alert variant="success" data-testid="alert-root" />);
    alert = screen.getByTestId('alert-root');
    expect(alert.className).toContain('text-success');

    rerender(<Alert variant="warning" data-testid="alert-root" />);
    alert = screen.getByTestId('alert-root');
    expect(alert.className).toContain('text-warning');

    rerender(<Alert variant="info" data-testid="alert-root" />);
    alert = screen.getByTestId('alert-root');
    expect(alert.className).toContain('border-info/50');
  });

  it('renders title and description wrappers with merged custom classes', () => {
    render(
      <>
        <AlertTitle className="title-custom">Alert title</AlertTitle>
        <AlertDescription className="desc-custom">Alert description</AlertDescription>
      </>,
    );

    const title = screen.getByText('Alert title');
    const description = screen.getByText('Alert description');

    expect(title.tagName).toBe('H5');
    expect(title.className).toContain('mb-1');
    expect(title.className).toContain('title-custom');

    expect(description.tagName).toBe('DIV');
    expect(description.className).toContain('text-sm');
    expect(description.className).toContain('desc-custom');
  });

  it('renders ErrorAlert defaults without retry button when onRetry is missing', () => {
    render(<ErrorAlert message="Something went wrong" className="outer-custom" />);

    const alert = screen.getByRole('alert');

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    expect(alert.className).toContain('text-destructive');
    expect(alert.className).toContain('outer-custom');
    expect(alert.className).toContain('rounded-2xl');
  });

  it('renders retry button when onRetry exists and invokes callback', () => {
    const onRetry = jest.fn();

    render(
      <ErrorAlert
        title="Custom title"
        message={<span>Custom message</span>}
        onRetry={onRetry}
        retryLabel="Retry now"
      />,
    );

    expect(screen.getByText('Custom title')).toBeInTheDocument();
    expect(screen.getByText('Custom message')).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: 'Retry now' });
    fireEvent.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('keeps export display names stable', () => {
    expect(Alert.displayName).toBe('Alert');
    expect(AlertTitle.displayName).toBe('AlertTitle');
    expect(AlertDescription.displayName).toBe('AlertDescription');
  });
});
