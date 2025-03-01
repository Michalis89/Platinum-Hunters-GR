import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GeneralQuestionForm from '../GeneralQuestionForm';

describe.skip('GeneralQuestionForm Component', () => {
  const mockOnTitleChange = jest.fn();

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('renders the form correctly', () => {
    render(<GeneralQuestionForm onTitleChange={mockOnTitleChange} />);
    expect(screen.getByText(/Κατηγορία Ερώτησης/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/example@email.com/i)).toBeInTheDocument();
  });

  it.skip('shows an error message when email is invalid', async () => {
    render(<GeneralQuestionForm onTitleChange={mockOnTitleChange} />);
    fireEvent.change(screen.getByPlaceholderText(/example@email.com/i), {
      target: { value: 'invalid-email' },
    });
    fireEvent.click(screen.getByText(/Αποστολή Αιτήματος/i));
    expect(await screen.findByText(/Το email πρέπει να είναι έγκυρο/i)).toBeInTheDocument();
  });

  it.skip('displays success message after successful submission', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: '✅ Η ερώτησή σας υποβλήθηκε επιτυχώς!' }),
    } as Response);

    render(<GeneralQuestionForm onTitleChange={mockOnTitleChange} />);

    fireEvent.change(screen.getByPlaceholderText(/example@email.com/i), {
      target: { value: 'user@example.com' },
    });

    fireEvent.click(screen.getByText(/Αποστολή Αιτήματος/i));

    await waitFor(() => {
      expect(screen.queryByText(/Η ερώτησή σας υποβλήθηκε επιτυχώς/i)).toBeInTheDocument();
    });
  });

  it.skip('displays error message when API call fails', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: '❌ Σφάλμα κατά την υποβολή.' }),
    } as Response);

    render(<GeneralQuestionForm onTitleChange={mockOnTitleChange} />);

    fireEvent.change(screen.getByPlaceholderText(/example@email.com/i), {
      target: { value: 'user@example.com' },
    });

    fireEvent.click(screen.getByText(/Αποστολή Αιτήματος/i));

    await waitFor(() => {
      expect(screen.queryByText(/Σφάλμα κατά την υποβολή/i)).toBeInTheDocument();
    });
  });

  it.skip('updates title when category changes', async () => {
    render(<GeneralQuestionForm onTitleChange={mockOnTitleChange} />);

    fireEvent.click(screen.getByTestId('dropdown'));
    await waitFor(() => fireEvent.click(screen.getByText(/Πληροφορίες/i)));

    expect(mockOnTitleChange).toHaveBeenCalledWith('Χρειάζεστε πληροφορίες; Ρωτήστε μας!');
  });
});
