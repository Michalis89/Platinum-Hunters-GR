// __tests__/Guides.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Guides from './page';
import { useGetGamesQuery } from '@/store/api/gamesApi';

import processedGamesReducer, {
  initialState as processedGamesInitialState,
} from '@/store/slices/processedGamesSlice';
import genresReducer, { initialState as genresInitialState } from '@/store/slices/genresSlice';
import developerReducer, {
  initialState as developerInitialState,
} from '@/store/slices/developerSlice';
import difficultyReducer, {
  initialState as difficultyInitialState,
} from '@/store/slices/difficultySlice';
import platformsReducer, {
  initialState as platformsInitialState,
} from '@/store/slices/platformsSlice';

jest.mock('@/store/api/gamesApi', () => ({
  useGetGamesQuery: jest.fn(),
}));

jest.mock('@/app/components/ui/SearchBar', () => ({
  SearchBar: ({ value, onChange }) => (
    <input data-testid="search-bar" value={value} onChange={e => onChange(e.target.value)} />
  ),
}));

jest.mock('@/app/components/ui/AlertMessage', () => {
  const AlertMessageMock = ({ message }) => <div data-testid="alert">{message}</div>;
  AlertMessageMock.displayName = 'AlertMessageMock';
  return AlertMessageMock;
});

jest.mock('@/app/components/guides/GameGrid', () => {
  const GameGridMock = ({ games }) => <div data-testid="game-grid">{games.length} games</div>;
  GameGridMock.displayName = 'GameGridMock';
  return GameGridMock;
});

jest.mock('@/app/components/ui/Skeleton', () => {
  const SkeletonMock = () => <div data-testid="skeleton">Loading...</div>;
  SkeletonMock.displayName = 'SkeletonMock';
  return SkeletonMock;
});

jest.mock('@/app/components/filters/SortFilter', () => {
  const SortFilterMock = () => <div data-testid="sort-filter" />;
  SortFilterMock.displayName = 'SortFilterMock';
  return SortFilterMock;
});

jest.mock('@/app/components/filters/FiltersPanel', () => {
  const FiltersPanelMock = () => <div data-testid="filters-panel" />;
  FiltersPanelMock.displayName = 'FiltersPanelMock';
  return FiltersPanelMock;
});

jest.mock('@/app/components/ui/Dropdown', () => {
  const DropdownMock = () => <div data-testid="dropdown" />;
  DropdownMock.displayName = 'DropdownMock';
  return DropdownMock;
});

jest.mock('@/app/components/filters/PlatformFilter', () => {
  const PlatformFilterMock = () => <div data-testid="platform-filter" />;
  PlatformFilterMock.displayName = 'PlatformFilterMock';
  return PlatformFilterMock;
});

jest.mock('@/app/components/filters/GenreFilter', () => {
  const GenreFilterMock = () => <div data-testid="genre-filter" />;
  GenreFilterMock.displayName = 'GenreFilterMock';
  return GenreFilterMock;
});

jest.mock('@/app/components/filters/DifficultyFilter', () => {
  const DifficultyFilterMock = () => <div data-testid="difficulty-filter" />;
  DifficultyFilterMock.displayName = 'DifficultyFilterMock';
  return DifficultyFilterMock;
});

jest.mock('@/app/components/filters/DeveloperFilter', () => {
  const DeveloperFilterMock = () => <div data-testid="developer-filter" />;
  DeveloperFilterMock.displayName = 'DeveloperFilterMock';
  return DeveloperFilterMock;
});

jest.mock('@/app/components/filters/HourFilter', () => {
  const HourFilterMock = () => <div data-testid="hour-filter" />;
  HourFilterMock.displayName = 'HourFilterMock';
  return HourFilterMock;
});

jest.mock('@/app/components/filters/YearFilter', () => {
  const YearFilterMock = () => <div data-testid="year-filter" />;
  YearFilterMock.displayName = 'YearFilterMock';
  return YearFilterMock;
});

jest.mock('@/app/components/filters/ResetFilters', () => {
  const ResetFiltersMock = () => <div data-testid="reset-filters" />;
  ResetFiltersMock.displayName = 'ResetFiltersMock';
  return ResetFiltersMock;
});

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

jest.mock('lucide-react', () => ({
  BookOpen: () => <svg data-testid="book-icon" />,
  ChevronDown: () => <svg data-testid="chevron-icon" />,
}));

const createTestStore = () =>
  configureStore({
    reducer: {
      processedGames: processedGamesReducer,
      genres: genresReducer,
      developer: developerReducer,
      difficulty: difficultyReducer,
      platforms: platformsReducer,
    },
    preloadedState: {
      processedGames: processedGamesInitialState,
      genres: genresInitialState,
      developer: developerInitialState,
      difficulty: difficultyInitialState,
      platforms: platformsInitialState,
    },
  });

describe.skip('Guides Component', () => {
  const mockGames = {
    games: [
      { id: 1, title: 'Game 1', platform: 'PC', genre: 'Action', hours: 20, release_year: 2020 },
      { id: 2, title: 'Game 2', platform: 'PS5', genre: 'RPG', hours: 40, release_year: 2021 },
    ],
  };

  it('renders loading state', () => {
    (useGetGamesQuery as jest.Mock).mockReturnValue({
      isLoading: true,
      data: null,
      error: null,
    });

    render(
      <Provider store={createTestStore()}>
        <Guides />
      </Provider>,
    );

    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(screen.getByText('Οδηγοί')).toBeInTheDocument();
  });

  it('renders games when data is loaded', async () => {
    (useGetGamesQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      data: mockGames,
      error: null,
    });

    render(
      <Provider store={createTestStore()}>
        <Guides />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('game-grid')).toBeInTheDocument();
      expect(screen.getByText('2 games')).toBeInTheDocument();
    });
  });

  it('shows error message when API fails', async () => {
    (useGetGamesQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      data: null,
      error: { status: 500, data: 'Server error' },
    });

    render(
      <Provider store={createTestStore()}>
        <Guides />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('alert')).toBeInTheDocument();
    });
  });

  it('shows no games message when filtered results are empty', async () => {
    (useGetGamesQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      data: { games: [] },
      error: null,
    });

    render(
      <Provider store={createTestStore()}>
        <Guides />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Δεν βρέθηκαν παιχνίδια.')).toBeInTheDocument();
    });
  });

  it('toggles filters panel', async () => {
    (useGetGamesQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      data: mockGames,
      error: null,
    });

    const { rerender } = render(
      <Provider store={createTestStore()}>
        <Guides />
      </Provider>,
    );

    const filterButton = screen.getByText('Φίλτρα');
    filterButton.click();

    rerender(
      <Provider store={createTestStore()}>
        <Guides />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('filters-panel')).toBeInTheDocument();
    });
  });
});
