import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import Guides from './page';
import { server } from '@/mocks/server';
import { rest } from 'msw';

describe('Guides Page', () => {
  it('renders the heading Trophy Guides', () => {
    render(<Guides />);
    expect(screen.getByText('Trophy Guides')).toBeInTheDocument();
  });

  it('renders the search bar', () => {
    render(<Guides />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows skeleton while loading', async () => {
    render(<Guides />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());
  });

  it('shows alert message on error', async () => {
    server.use(
      rest.get('/api/games', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Internal Server Error' }));
      }),
    );

    render(<Guides />);

    await waitFor(() =>
      expect(screen.getByText('Σφάλμα κατά τη φόρτωση των παιχνιδιών.')).toBeInTheDocument(),
    );
  });

  it('shows game grid when data is loaded', async () => {
    render(<Guides />);
    await waitFor(() => expect(screen.getByText('Elden Ring')).toBeInTheDocument());
  });

  it('shows no results message when search has no matches', async () => {
    render(<Guides />);
    await waitFor(() => expect(screen.getByText('Elden Ring')).toBeInTheDocument());

    const searchInput = screen.getByRole('textbox');

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'NonExistingGame' } });
    });

    await waitFor(() => expect(screen.getByText('Δεν βρέθηκαν παιχνίδια.')).toBeInTheDocument());
  });
});
