import { render, screen } from '@testing-library/react';
import HobbiesPage, { metadata } from '@/app/(main)/hobbies/page';

jest.mock('@/app/components/hobbies', () => ({
  __esModule: true,
  HobbiesHero: () => <div data-testid="hobbies-hero" />,
  HobbiesCategoryCard: ({ category }: { category: { slug: string } }) => (
    <div data-testid="hobbies-category-card">{category.slug}</div>
  ),
}));

describe('HobbiesPage', () => {
  it('exports expected metadata', () => {
    expect(metadata).toMatchObject({
      title: 'Hobbies Catalog',
      description: 'Browse hobby categories across backlog tracking, articles, and reviews.',
    });
  });

  it('renders only core catalog categories', () => {
    render(<HobbiesPage />);

    expect(screen.getByTestId('hobbies-hero')).toBeInTheDocument();
    const cards = screen.getAllByTestId('hobbies-category-card');
    expect(cards).toHaveLength(6);
    expect(cards.map(card => card.textContent)).toEqual([
      'games',
      'anime',
      'manga',
      'movies',
      'tv',
      'books',
    ]);
  });
});
