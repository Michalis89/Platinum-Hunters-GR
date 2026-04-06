import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    type,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: string;
    className?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} type={type as 'button'} className={className}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 className={className}>{children}</h2>
  ),
}));

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => (
    <div data-testid="popover-trigger">{children}</div>
  ),
  PopoverContent: ({
    children,
  }: {
    children: React.ReactNode;
    className?: string;
    side?: string;
    align?: string;
  }) => <div data-testid="popover-content">{children}</div>,
}));

jest.mock('@/data/hobbyConstants', () => ({
  // 'other' has no entry in CATEGORY_LABELS → exercises the || cat fallback branch
  CATEGORIES: [
    'games',
    'anime',
    'manga',
    'books',
    'movies',
    'tv',
    'coding',
    'pet',
    'vape',
    'other',
  ],
}));

jest.mock('../../_constants', () => ({
  PRIMARY_HOBBY_CATEGORIES: ['games', 'anime', 'manga', 'books', 'movies', 'tv'],
  SOCIAL_LAYER_HOBBY_CATEGORIES: ['coding', 'pet', 'vape'],
}));

import { CategorySelectionSection } from '../category-selection-section';

describe('CategorySelectionSection', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    mockOnToggle.mockClear();
  });

  it('renders the section title', () => {
    render(
      <CategorySelectionSection
        selectedCategories={[]}
        socialLayerEnabled={true}
        onToggleCategory={mockOnToggle}
      />,
    );
    expect(screen.getByText('Hobby Categories')).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(
      <CategorySelectionSection
        selectedCategories={[]}
        socialLayerEnabled={true}
        onToggleCategory={mockOnToggle}
      />,
    );
    expect(screen.getByText(/Select the categories/)).toBeInTheDocument();
  });

  it('renders all categories when socialLayerEnabled is true', () => {
    render(
      <CategorySelectionSection
        selectedCategories={[]}
        socialLayerEnabled={true}
        onToggleCategory={mockOnToggle}
      />,
    );
    expect(screen.getByText('Games')).toBeInTheDocument();
    expect(screen.getByText('Anime')).toBeInTheDocument();
    expect(screen.getByText('Coding')).toBeInTheDocument();
    expect(screen.getByText('Pet')).toBeInTheDocument();
    expect(screen.getByText('Vape')).toBeInTheDocument();
  });

  it('renders primary categories when socialLayerEnabled is false', () => {
    render(
      <CategorySelectionSection
        selectedCategories={[]}
        socialLayerEnabled={false}
        onToggleCategory={mockOnToggle}
      />,
    );
    expect(screen.getByText('Games')).toBeInTheDocument();
    expect(screen.getByText('Anime')).toBeInTheDocument();
    expect(screen.getByText('TV Series')).toBeInTheDocument();
  });

  it('renders locked social categories with popover when socialLayerEnabled is false', () => {
    render(
      <CategorySelectionSection
        selectedCategories={[]}
        socialLayerEnabled={false}
        onToggleCategory={mockOnToggle}
      />,
    );
    expect(screen.getAllByTestId('popover-trigger').length).toBe(3);
    expect(screen.getByText('Coding')).toBeInTheDocument();
  });

  it('calls onToggleCategory when a category chip is clicked', () => {
    render(
      <CategorySelectionSection
        selectedCategories={[]}
        socialLayerEnabled={true}
        onToggleCategory={mockOnToggle}
      />,
    );
    fireEvent.click(screen.getByText('Games'));
    expect(mockOnToggle).toHaveBeenCalledWith('games');
  });

  it('reflects active state for selected categories', () => {
    render(
      <CategorySelectionSection
        selectedCategories={['games']}
        socialLayerEnabled={true}
        onToggleCategory={mockOnToggle}
      />,
    );
    const gamesBtn = screen.getByText('Games').closest('button');
    // Active class should be present
    expect(gamesBtn?.className).toContain('border-primary/35');
  });

  it('does not call onToggleCategory for disabled locked categories', () => {
    render(
      <CategorySelectionSection
        selectedCategories={[]}
        socialLayerEnabled={false}
        onToggleCategory={mockOnToggle}
      />,
    );
    const codingBtn = screen.getByText('Coding').closest('button');
    expect(codingBtn).toBeDisabled();
  });

  it('renders popover content with settings message for locked categories', () => {
    render(
      <CategorySelectionSection
        selectedCategories={[]}
        socialLayerEnabled={false}
        onToggleCategory={mockOnToggle}
      />,
    );
    const popoverContents = screen.getAllByTestId('popover-content');
    expect(popoverContents[0]).toHaveTextContent(/Social Layer/);
  });
});
