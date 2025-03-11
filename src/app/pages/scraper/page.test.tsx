import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScraperPage from './page';
import '@testing-library/jest-dom';

// Mock next/image properly
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

// Mock fetch with proper Response object
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Response helper with clone method
const createMockResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
  clone: () => createMockResponse(data, status),
});

const mockScrapedData = {
  title: 'Test Game',
  platform: 'PS5',
  gameImage: 'test-image.jpg',
  difficulty: 'Medium',
  difficultyColor: '#ffa500',
  playthroughs: '2',
  playthroughsColor: '#00ff00',
  hours: '40-50',
  hoursColor: '#0000ff',
  trophies: {
    platinum: 1,
    gold: 3,
    silver: 10,
    bronze: 20,
  },
  totalPoints: 3250,
  steps: [
    {
      stepNumber: 1,
      description: 'Complete story mode',
      trophies: ['Story Complete'],
    },
  ],
};

describe('ScraperPage', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('handles successful scrape', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(mockScrapedData));

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ScraperPage />);

    // Test empty state first
    expect(screen.queryByText(mockScrapedData.title)).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/βάλε το url/i), 'https://example.com');
    await user.click(screen.getByRole('button', { name: /scrape/i }));

    // Verify loading state
    expect(screen.getByRole('button', { name: /scrape/i })).toBeDisabled();

    // Resolve API call
    jest.runAllTimers();

    // Verify loaded data
    await waitFor(() => {
      expect(screen.getByText(mockScrapedData.title)).toBeInTheDocument();
      expect(screen.getByAltText(mockScrapedData.title)).toBeInTheDocument();
    });
  });

  test('handles save functionality', async () => {
    mockFetch
      .mockResolvedValueOnce(createMockResponse(mockScrapedData))
      .mockResolvedValueOnce(createMockResponse({}, 200));

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ScraperPage />);

    // Perform scrape
    await user.type(screen.getByPlaceholderText(/βάλε το url/i), 'https://example.com');
    await user.click(screen.getByRole('button', { name: /scrape/i }));
    jest.runAllTimers();

    // Verify data loaded
    await waitFor(() => screen.getByText(mockScrapedData.title));

    // Perform save
    await user.click(screen.getByRole('button', { name: /αποθήκευση/i }));
    jest.runAllTimers();

    // Verify final state
    await waitFor(() => {
      expect(screen.getByText(/αποθηκεύτηκε επιτυχώς/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/βάλε το url/i)).toHaveValue('');
    });
  });
});
