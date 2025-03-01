import { render, screen } from '@testing-library/react';
import GuideStats from '../GuideStats';

describe('GuideStats Component', () => {
  it('renders difficulty, playthroughs, and hours correctly', () => {
    render(
      <GuideStats
        difficulty="Hard"
        difficultyColor="red"
        playthroughs={2}
        playthroughsColor="blue"
        hours={50}
        hoursColor="green"
      />,
    );

    expect(screen.getByText('Hard Difficulty')).toBeInTheDocument();
    expect(screen.getByText('2 Playthroughs')).toBeInTheDocument();
    expect(screen.getByText('50 Hours')).toBeInTheDocument();
  });

  it('renders "Playthrough" in singular when playthroughs is 1', () => {
    render(
      <GuideStats
        difficulty="Medium"
        difficultyColor="orange"
        playthroughs={1}
        playthroughsColor="blue"
        hours={30}
        hoursColor="green"
      />,
    );

    expect(screen.getByText('1 Playthrough')).toBeInTheDocument();
  });
});
