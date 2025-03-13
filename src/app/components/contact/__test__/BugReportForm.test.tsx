import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BugReportForm from '../BugReportForm';

global.URL.createObjectURL = jest.fn(() => 'mocked-screenshot-url');

describe('BugReportForm', () => {
  it('renders correctly', async () => {
    render(<BugReportForm />);

    expect(screen.getByText('Τύπος Προβλήματος')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('dropdown'));

    expect(await screen.findByTestId('dropdown-options')).toBeInTheDocument();

    fireEvent.click(await screen.findByText('UI Issue'));

    expect(await screen.findByText('UI Issue')).toBeInTheDocument();
  });

  it('shows error if required fields are missing', async () => {
    render(<BugReportForm />);

    fireEvent.click(screen.getByTestId('dropdown'));
    fireEvent.click(await screen.findByText('UI Issue'));

    fireEvent.click(screen.getByText(/Υποβολή Αναφοράς/i));

    await waitFor(() => {
      expect(screen.findByText('Ο τύπος προβλήματος είναι υποχρεωτικός.')).resolves.toBeTruthy();
      expect(screen.findByText('Η περιγραφή του bug είναι υποχρεωτική.')).resolves.toBeTruthy();
    });
  });

  it('submits form successfully', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    ) as jest.Mock;

    render(<BugReportForm />);

    fireEvent.click(screen.getByTestId('dropdown'));
    fireEvent.click(await screen.findByText('UI Issue'));

    fireEvent.change(screen.getByPlaceholderText('Περιγραφή του bug...'), {
      target: { value: 'Το κουμπί δεν λειτουργεί' },
    });

    fireEvent.click(screen.getByText('Υποβολή Αναφοράς'));

    await waitFor(() => {
      expect(screen.getByText('✅ Η αναφορά υποβλήθηκε!')).toBeInTheDocument();
    });
  });

  it('handles submission failure', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Σφάλμα στο server' }),
      }),
    ) as jest.Mock;

    render(<BugReportForm />);

    fireEvent.click(screen.getByTestId('dropdown'));
    fireEvent.click(await screen.findByText('UI Issue'));

    fireEvent.change(screen.getByPlaceholderText('Περιγραφή του bug...'), {
      target: { value: 'Το κουμπί δεν λειτουργεί' },
    });

    fireEvent.click(screen.getByText('Υποβολή Αναφοράς'));

    await waitFor(() => {
      expect(screen.getByText('❌ Σφάλμα στο server')).toBeInTheDocument();
    });
  });

  it('shows screenshot preview', async () => {
    render(<BugReportForm />);

    const file = new File(['dummy content'], 'screenshot.png', { type: 'image/png' });

    fireEvent.click(screen.getByTestId('dropdown'));
    fireEvent.click(await screen.findByText('UI Issue'));

    const input = await waitFor(() => screen.getByTestId('file-input'));
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalledWith(file);
      expect(screen.getByAltText('Screenshot preview')).toBeInTheDocument();
    });
  });

  it('resets form after successful submission', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    ) as jest.Mock;

    render(<BugReportForm />);

    fireEvent.click(screen.getByTestId('dropdown'));
    fireEvent.click(await screen.findByText('UI Issue'));

    fireEvent.change(screen.getByPlaceholderText('Περιγραφή του bug...'), {
      target: { value: 'Το κουμπί δεν λειτουργεί' },
    });

    fireEvent.click(screen.getByText(/Υποβολή Αναφοράς/i));

    await waitFor(() => {
      expect(screen.getByText('✅ Η αναφορά υποβλήθηκε!')).toBeInTheDocument();
    });

    await waitFor(() => {
      const input = screen.queryByPlaceholderText('Περιγραφή του bug...');
      if (input) {
        expect(input).toHaveValue('');
      }
    });

    await waitFor(() => {
      expect(screen.getByTestId('dropdown')).toHaveTextContent('Επιλέξτε');
    });
  });
});
