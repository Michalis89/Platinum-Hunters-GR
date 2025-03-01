import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ScraperPage from '@/app/pages/scraper/page';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

jest.mock('next/image', () => {
  const MockNextImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} data-testid="game-image" />
  );
  MockNextImage.displayName = 'MockNextImage';
  return MockNextImage;
});

const server = setupServer(
  rest.post('/api/scrape', (req, res, ctx) => {
    return res(ctx.json({ title: 'Test Game', platform: 'PS5', gameImage: '/test-image.jpg' }));
  }),
  rest.post('/api/save-guide', (req, res, ctx) => {
    return res(ctx.status(200));
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ScraperPage', () => {
  it('renders the initial UI correctly', () => {
    render(<ScraperPage />);
    expect(screen.getByText('🏆 PSN Trophy Guide Scraper')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Βάλε το URL του guide...')).toBeInTheDocument();
  });

  it('displays error message when trying to scrape with empty URL', async () => {
    render(<ScraperPage />);
    fireEvent.click(screen.getByText('Scrape'));

    await waitFor(() => {
      expect(screen.getByText('Βάλε ένα έγκυρο URL!')).toBeInTheDocument();
    });
  });

  it('fetches and displays scraped game data', async () => {
    render(<ScraperPage />);
    const input = screen.getByPlaceholderText('Βάλε το URL του guide...');
    fireEvent.change(input, { target: { value: 'https://valid-url.com' } });
    fireEvent.click(screen.getByText('Scrape'));

    await waitFor(() => screen.getByText('✅ Scraping επιτυχές!'));
    expect(screen.getByText('Test Game')).toBeInTheDocument();
    expect(screen.getByText('PS5')).toBeInTheDocument();
    expect(screen.getByTestId('game-image')).toHaveAttribute('src', '/test-image.jpg');
  });

  it('saves scraped game data successfully', async () => {
    render(<ScraperPage />);
    const input = screen.getByPlaceholderText('Βάλε το URL του guide...');
    fireEvent.change(input, { target: { value: 'https://valid-url.com' } });
    fireEvent.click(screen.getByText('Scrape'));

    await waitFor(() => screen.getByText('✅ Scraping επιτυχές!'));
    fireEvent.click(screen.getByText('💾 Αποθήκευση στη βάση'));

    await waitFor(() => {
      expect(screen.getByText('✅ Ο οδηγός αποθηκεύτηκε επιτυχώς!')).toBeInTheDocument();
    });
  });
});
