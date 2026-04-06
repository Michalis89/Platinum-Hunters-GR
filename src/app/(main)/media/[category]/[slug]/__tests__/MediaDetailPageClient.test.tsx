import { render, screen } from '@testing-library/react';
import MediaDetailPageClient from '@/app/(main)/media/[category]/[slug]/MediaDetailPageClient';
import type { MediaItem } from '@/lib/media/types';

const implMock = jest.fn(
  ({ category, mediaItem }: { category: string; mediaItem: { id: number } }) => (
    <div data-testid="impl">{`${category}:${mediaItem.id}`}</div>
  ),
);

jest.mock('@/app/components/media-detail/MediaDetailPageClientRoute', () => ({
  __esModule: true,
  default: (props: { category: string; mediaItem: { id: number } }) => implMock(props),
}));

describe('MediaDetailPageClient route wrapper', () => {
  it('delegates props to shared client implementation', () => {
    render(<MediaDetailPageClient category="games" mediaItem={{ id: 42 } as unknown as MediaItem} />);

    expect(screen.getByTestId('impl')).toHaveTextContent('games:42');
    expect(implMock).toHaveBeenCalledWith({ category: 'games', mediaItem: { id: 42 } });
  });
});
