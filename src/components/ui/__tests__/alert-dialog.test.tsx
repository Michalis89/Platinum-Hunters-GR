import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

describe('components/ui/alert-dialog', () => {
  const showModalMock = jest.fn(function showModal(this: HTMLDialogElement) {
    Object.defineProperty(this, 'open', {
      configurable: true,
      value: true,
      writable: true,
    });
  });

  const closeMock = jest.fn(function close(this: HTMLDialogElement) {
    Object.defineProperty(this, 'open', {
      configurable: true,
      value: false,
      writable: true,
    });
    this.dispatchEvent(new Event('close'));
  });

  beforeAll(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: showModalMock,
      writable: true,
    });

    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value: closeMock,
      writable: true,
    });
  });

  beforeEach(() => {
    showModalMock.mockClear();
    closeMock.mockClear();
  });

  it('throws if used outside AlertDialog context', () => {
    expect(() => render(<AlertDialogTrigger>Open</AlertDialogTrigger>)).toThrow(
      'AlertDialog components must be used within an AlertDialog',
    );
  });

  it('opens and closes in uncontrolled mode with trigger/action/cancel and callback', async () => {
    const onOpenChange = jest.fn();
    const onClose = jest.fn();
    const actionClick = jest.fn();
    const cancelClick = jest.fn();

    render(
      <AlertDialog onOpenChange={onOpenChange}>
        <AlertDialogTrigger>Delete</AlertDialogTrigger>
        <AlertDialogContent className="custom-content" onClose={onClose} data-testid="content">
          <AlertDialogHeader data-testid="header">Header</AlertDialogHeader>
          <AlertDialogTitle className="custom-title">Confirm delete</AlertDialogTitle>
          <AlertDialogDescription className="custom-description">
            Irreversible.
          </AlertDialogDescription>
          <AlertDialogFooter data-testid="footer">
            <AlertDialogCancel className="cancel-extra" onClick={cancelClick}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              size="sm"
              className="action-extra"
              onClick={actionClick}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    const trigger = screen.getByRole('button', { name: 'Delete' });
    trigger.focus();

    fireEvent.click(trigger);

    await waitFor(() => {
      expect(showModalMock).toHaveBeenCalledTimes(1);
    });

    const dialog = screen.getByRole('alertdialog', { hidden: true });
    expect(dialog).toBeInTheDocument();

    const content = screen.getByTestId('content');
    expect(content.className).toContain('custom-content');

    const header = screen.getByTestId('header');
    expect(header.className).toContain('text-center');

    const footer = screen.getByTestId('footer');
    expect(footer.className).toContain('flex-col-reverse');

    const title = screen.getByText('Confirm delete');
    expect(title.className).toContain('custom-title');

    const description = screen.getByText('Irreversible.');
    expect(description.className).toContain('custom-description');

    const cancel = screen.getByText('Cancel');
    expect(cancel.className).toContain('border');
    expect(cancel.className).toContain('cancel-extra');

    const action = screen.getByText('Continue');
    expect(action.className).toContain('bg-destructive');
    expect(action.className).toContain('h-8');
    expect(action.className).toContain('action-extra');

    fireEvent.click(action);
    expect(actionClick).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(closeMock).toHaveBeenCalledTimes(1);
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    fireEvent.click(trigger);

    await waitFor(() => {
      expect(showModalMock).toHaveBeenCalledTimes(2);
    });

    fireEvent.click(cancel);
    expect(cancelClick).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(closeMock).toHaveBeenCalledTimes(2);
    });

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('supports controlled mode and asChild trigger behavior', async () => {
    const onOpenChange = jest.fn();
    const childClick = jest.fn();

    const { rerender } = render(
      <AlertDialog open={false} onOpenChange={onOpenChange}>
        <AlertDialogTrigger asChild>
          <button onClick={childClick}>Open as child</button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogAction>Ok</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open as child' }));

    expect(childClick).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(showModalMock).not.toHaveBeenCalled();

    rerender(
      <AlertDialog open={true} onOpenChange={onOpenChange}>
        <AlertDialogTrigger asChild>
          <button>Open as child</button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogCancel variant="secondary">Back</AlertDialogCancel>
          <AlertDialogAction>Ok</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>,
    );

    await waitFor(() => {
      expect(showModalMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByText('Back'));

    expect(onOpenChange).toHaveBeenCalledWith(false);

    rerender(
      <AlertDialog open={false} onOpenChange={onOpenChange}>
        <AlertDialogTrigger asChild>
          <button>Open as child</button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogCancel>Back</AlertDialogCancel>
          <AlertDialogAction>Ok</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>,
    );

    await waitFor(() => {
      expect(closeMock).toHaveBeenCalledTimes(1);
    });
  });

  it('falls back to a native button if asChild has non-element children', () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger asChild>Not an element child</AlertDialogTrigger>
      </AlertDialog>,
    );

    expect(screen.getByRole('button', { name: 'Not an element child' })).toBeInTheDocument();
  });

  it('invokes trigger onClick before opening', async () => {
    const triggerClick = jest.fn();
    const onOpenChange = jest.fn();

    render(
      <AlertDialog onOpenChange={onOpenChange}>
        <AlertDialogTrigger onClick={triggerClick}>Open</AlertDialogTrigger>
        <AlertDialogContent>Body</AlertDialogContent>
      </AlertDialog>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(triggerClick).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(showModalMock).toHaveBeenCalled();
    });
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('prevents default cancel event on dialog', async () => {
    render(
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>,
    );

    const dialog = screen.getByRole('alertdialog', { hidden: true }) as HTMLDialogElement;
    const cancelEvent = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancelEvent);

    expect(cancelEvent.defaultPrevented).toBe(true);
  });

  it('calls onClose and onOpenChange(false) when dialog emits close', () => {
    const onOpenChange = jest.fn();
    const onClose = jest.fn();

    render(
      <AlertDialog open={true} onOpenChange={onOpenChange}>
        <AlertDialogContent onClose={onClose}>Body</AlertDialogContent>
      </AlertDialog>,
    );

    const dialog = screen.getByRole('alertdialog', { hidden: true }) as HTMLDialogElement;
    dialog.dispatchEvent(new Event('close'));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('exports and metadata remain stable', () => {
    render(<AlertDialogPortal>Portal body</AlertDialogPortal>);

    expect(screen.getByText('Portal body')).toBeInTheDocument();

    expect(AlertDialogOverlay).toBe(AlertDialogContent);
    expect(AlertDialogContent.displayName).toBe('AlertDialogContent');
    expect(AlertDialogHeader.displayName).toBe('AlertDialogHeader');
    expect(AlertDialogFooter.displayName).toBe('AlertDialogFooter');
    expect(AlertDialogTitle.displayName).toBe('AlertDialogTitle');
    expect(AlertDialogDescription.displayName).toBe('AlertDialogDescription');
    expect(AlertDialogAction.displayName).toBe('AlertDialogAction');
    expect(AlertDialogCancel.displayName).toBe('AlertDialogCancel');
    expect(AlertDialogPortal.displayName).toBe('AlertDialogPortal');
  });
});
