import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GeneralQuestionForm from '../GeneralQuestionForm';

describe('GeneralQuestionForm', () => {
  const mockOnTitleChange = jest.fn();

  it('renders correctly with initial state', async () => {
    render(<GeneralQuestionForm onTitleChange={mockOnTitleChange} />);

    expect(screen.getByText('Κατηγορία Ερώτησης')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('example@email.com')).toBeInTheDocument();
  });

  it('updates the title when category changes', async () => {
    render(<GeneralQuestionForm onTitleChange={mockOnTitleChange} />);

    fireEvent.click(screen.getByTestId('dropdown'));
    fireEvent.click(await screen.findByText('Feedback'));

    expect(mockOnTitleChange).toHaveBeenCalledWith('Μοιραστείτε την άποψή σας μαζί μας!');
  });

  it('shows errors when required fields are missing', async () => {
    render(<GeneralQuestionForm onTitleChange={mockOnTitleChange} />);

    fireEvent.click(screen.getByTestId('dropdown'));

    await waitFor(() => {
      expect(screen.getByTestId('dropdown-options')).toBeInTheDocument();
    });

    const options = screen.getAllByRole('button');
    fireEvent.click(options.find(btn => btn.textContent === 'Υποστήριξη')!);

    fireEvent.click(screen.getByText('Αποστολή Αιτήματος'));

    await waitFor(() => {
      expect(
        screen.getByText('Το email είναι υποχρεωτικό και πρέπει να είναι έγκυρο.'),
      ).toBeInTheDocument();
      expect(screen.getByText('Η υπηρεσία είναι υποχρεωτική.')).toBeInTheDocument();
      expect(screen.getByText('Η περιγραφή είναι υποχρεωτική.')).toBeInTheDocument();
    });
  });

  it('submits form successfully', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    ) as jest.Mock;

    render(<GeneralQuestionForm onTitleChange={mockOnTitleChange} />);

    fireEvent.click(screen.getByTestId('dropdown'));

    await waitFor(() => {
      expect(screen.getByTestId('dropdown-options')).toBeInTheDocument();
    });

    const options = screen.getAllByRole('button');
    fireEvent.click(options.find(btn => btn.textContent === 'Υποστήριξη')!);

    fireEvent.change(screen.getByPlaceholderText('example@email.com'), {
      target: { value: 'test@example.com' },
    });

    fireEvent.change(screen.getByPlaceholderText('Ποια υπηρεσία αντιμετωπίζει πρόβλημα;'), {
      target: { value: 'Sample Service' },
    });

    fireEvent.change(screen.getByPlaceholderText('Δώστε μας μια περιγραφή...'), {
      target: { value: 'Service not working' },
    });

    fireEvent.click(screen.getByText('Αποστολή Αιτήματος'));

    await waitFor(() => {
      expect(screen.getByText('✅ Η ερώτησή σας υποβλήθηκε επιτυχώς!')).toBeInTheDocument();
    });
  });

  it('handles submission failure', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Σφάλμα κατά την υποβολή' }),
      }),
    ) as jest.Mock;

    render(<GeneralQuestionForm onTitleChange={mockOnTitleChange} />);

    fireEvent.click(screen.getByTestId('dropdown'));

    await waitFor(() => {
      expect(screen.getByTestId('dropdown-options')).toBeInTheDocument();
    });

    const options = screen.getAllByRole('button');
    fireEvent.click(options.find(btn => btn.textContent?.includes('Υποστήριξη'))!);

    fireEvent.change(screen.getByPlaceholderText('example@email.com'), {
      target: { value: 'test@example.com' },
    });

    fireEvent.change(screen.getByPlaceholderText('Ποια υπηρεσία αντιμετωπίζει πρόβλημα;'), {
      target: { value: 'Sample Service' },
    });

    fireEvent.change(screen.getByPlaceholderText('Δώστε μας μια περιγραφή...'), {
      target: { value: 'Service not working' },
    });

    fireEvent.click(screen.getByText('Αποστολή Αιτήματος'));

    await waitFor(() => {
      expect(screen.getByText('❌ Σφάλμα κατά την υποβολή')).toBeInTheDocument();
    });
  });

  it('resets the form after successful submission', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    ) as jest.Mock;

    render(<GeneralQuestionForm onTitleChange={mockOnTitleChange} />);

    fireEvent.click(screen.getByTestId('dropdown'));
    await waitFor(() => {
      expect(screen.getByTestId('dropdown-options')).toBeInTheDocument();
    });

    const options = screen.getAllByRole('button');
    fireEvent.click(options.find(btn => btn.textContent === 'Υποστήριξη')!);

    fireEvent.change(screen.getByPlaceholderText('example@email.com'), {
      target: { value: 'test@example.com' },
    });

    fireEvent.change(screen.getByPlaceholderText('Ποια υπηρεσία αντιμετωπίζει πρόβλημα;'), {
      target: { value: 'Sample Service' },
    });

    fireEvent.change(screen.getByPlaceholderText('Δώστε μας μια περιγραφή...'), {
      target: { value: 'Service not working' },
    });

    fireEvent.click(screen.getByText('Αποστολή Αιτήματος'));

    await waitFor(() => {
      expect(screen.getByText('✅ Η ερώτησή σας υποβλήθηκε επιτυχώς!')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('example@email.com')).toHaveValue('');
      expect(screen.getByTestId('dropdown')).toHaveTextContent('Υποστήριξη');
    });
  });
});
