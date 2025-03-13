import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeatureRequestForm from '../FeatureRequestForm';

describe('FeatureRequestForm Component', () => {
  it('renders the form correctly', () => {
    render(<FeatureRequestForm />);

    expect(screen.getByPlaceholderText(/Γράψτε έναν σύντομο τίτλο/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Περιγράψτε το feature/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Εξηγήστε τη σημασία του feature/i)).toBeInTheDocument();
    expect(screen.getByText(/Υποβολή Αιτήματος/i)).toBeInTheDocument();
  });

  it('shows validation errors when required fields are empty', async () => {
    render(<FeatureRequestForm />);

    fireEvent.click(screen.getByText(/Υποβολή Αιτήματος/i));

    const errorMessages = await screen.findAllByText(/Το πεδίο είναι υποχρεωτικό/i);
    expect(errorMessages.length).toBeGreaterThanOrEqual(3);
  });

  it('displays a success message after a successful submission', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: '✅ Η υποβολή ολοκληρώθηκε επιτυχώς!' }),
    } as Response);

    render(<FeatureRequestForm />);

    fireEvent.change(screen.getByPlaceholderText(/Γράψτε έναν σύντομο τίτλο/i), {
      target: { value: 'New Feature' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Περιγράψτε το feature/i), {
      target: { value: 'Feature description' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Εξηγήστε τη σημασία του feature/i), {
      target: { value: 'Feature importance' },
    });

    fireEvent.click(screen.getByText(/Υποβολή Αιτήματος/i));

    await waitFor(() => {
      expect(screen.getByText(/Η υποβολή ολοκληρώθηκε επιτυχώς/i)).toBeInTheDocument();
    });
  });

  it('displays an error message when API call fails', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ error: '❌ Σφάλμα κατά την υποβολή.' }),
    } as Response);

    render(<FeatureRequestForm />);

    fireEvent.change(screen.getByPlaceholderText(/Γράψτε έναν σύντομο τίτλο/i), {
      target: { value: 'New Feature' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Περιγράψτε το feature/i), {
      target: { value: 'Feature description' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Εξηγήστε τη σημασία του feature/i), {
      target: { value: 'Feature importance' },
    });

    fireEvent.click(screen.getByText(/Υποβολή Αιτήματος/i));

    await waitFor(() => {
      expect(screen.getByText(/Σφάλμα κατά την υποβολή/i)).toBeInTheDocument();
    });
  });
});
