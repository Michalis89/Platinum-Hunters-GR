import { render, screen } from '@testing-library/react';
import GameDetailsInfo from '../GameDetailsInfo';

describe('GameDetailsInfo Component', () => {
  it('renders all provided game details correctly', () => {
    render(
      <GameDetailsInfo
        release_year={2022}
        developer="Naughty Dog"
        publisher="Sony Interactive Entertainment"
        genre="Action-Adventure"
        rating={9.5}
        metacritic={92}
        esrb_rating="M (Mature)"
      />,
    );

    expect(screen.getByText('Release Year:')).toBeInTheDocument();
    expect(screen.getByText('2022')).toBeInTheDocument();

    expect(screen.getByText('Developer:')).toBeInTheDocument();
    expect(screen.getByText('Naughty Dog')).toBeInTheDocument();

    expect(screen.getByText('Publisher:')).toBeInTheDocument();
    expect(screen.getByText('Sony Interactive Entertainment')).toBeInTheDocument();

    expect(screen.getByText('Genre:')).toBeInTheDocument();
    expect(screen.getByText('Action-Adventure')).toBeInTheDocument();

    expect(screen.getByText('Rating:')).toBeInTheDocument();
    expect(screen.getByText('9.5')).toBeInTheDocument();

    expect(screen.getByText('Metacritic:')).toBeInTheDocument();
    expect(screen.getByText('92')).toBeInTheDocument();

    expect(screen.getByText('ESRB Rating:')).toBeInTheDocument();
    expect(screen.getByText('M (Mature)')).toBeInTheDocument();
  });

  it('does not render missing details', () => {
    render(
      <GameDetailsInfo
        release_year={null}
        developer={null}
        publisher={null}
        genre={null}
        rating={null}
        metacritic={null}
        esrb_rating={null}
      />,
    );

    expect(screen.queryByText('Release Year:')).not.toBeInTheDocument();
    expect(screen.queryByText('Developer:')).not.toBeInTheDocument();
    expect(screen.queryByText('Publisher:')).not.toBeInTheDocument();
    expect(screen.queryByText('Genre:')).not.toBeInTheDocument();
    expect(screen.queryByText('Rating:')).not.toBeInTheDocument();
    expect(screen.queryByText('Metacritic:')).not.toBeInTheDocument();
    expect(screen.queryByText('ESRB Rating:')).not.toBeInTheDocument();
  });
});
