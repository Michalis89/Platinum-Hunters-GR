import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewGuideForm from '../NewGuideForm';

describe('NewGuideForm Component', () => {
  it('renders the form correctly', () => {
    render(<NewGuideForm />);

    expect(screen.getByLabelText(/Όνομα Παιχνιδιού/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Γράψτε το όνομα του παιχνιδιού/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Προσθέστε περισσότερες λεπτομέρειες/i)).toBeInTheDocument();
    expect(screen.getByText(/Υποβολή Αιτήματος/i)).toBeInTheDocument();
  });

  it('shows an error message when the game name is empty', async () => {
    render(<NewGuideForm />);

    fireEvent.click(screen.getByText(/Υποβολή Αιτήματος/i));

    await waitFor(() => {
      expect(screen.getByText(/Το όνομα του παιχνιδιού είναι υποχρεωτικό/i)).toBeInTheDocument();
    });
  });

  it('clears error message when user starts typing', async () => {
    render(<NewGuideForm />);

    fireEvent.click(screen.getByText(/Υποβολή Αιτήματος/i));

    await waitFor(() => {
      expect(screen.getByText(/Το όνομα του παιχνιδιού είναι υποχρεωτικό/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Γράψτε το όνομα του παιχνιδιού/i), {
      target: { value: 'Elden Ring' },
    });

    await waitFor(() => {
      expect(
        screen.queryByText(/Το όνομα του παιχνιδιού είναι υποχρεωτικό/i),
      ).not.toBeInTheDocument();
    });
  });

  it('displays success message after successful submission', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: '✅ Το αίτημά σας καταχωρήθηκε με επιτυχία!' }),
      }),
    ) as jest.Mock;

    render(<NewGuideForm />);

    fireEvent.change(screen.getByPlaceholderText(/Γράψτε το όνομα του παιχνιδιού/i), {
      target: { value: 'Elden Ring' },
    });

    fireEvent.click(screen.getByText(/Υποβολή Αιτήματος/i));

    await waitFor(() => {
      expect(screen.getByText(/Το αίτημά σας καταχωρήθηκε με επιτυχία/i)).toBeInTheDocument();
    });
  });

  it('displays error message when API call fails', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Σφάλμα κατά την υποβολή.' }),
      }),
    ) as jest.Mock;

    render(<NewGuideForm />);

    fireEvent.change(screen.getByPlaceholderText(/Γράψτε το όνομα του παιχνιδιού/i), {
      target: { value: 'Elden Ring' },
    });

    fireEvent.click(screen.getByText(/Υποβολή Αιτήματος/i));

    await waitFor(() => {
      expect(screen.getByText(/Σφάλμα κατά την υποβολή./i)).toBeInTheDocument();
    });
  });
});
