import { render, screen } from '@testing-library/react';
import TrophyGuides from '../TrophyGuides';
import { GuideProps } from '@/types/interfaces';

describe('TrophyGuides Component', () => {
  const mockGuides: GuideProps[] = [
    {
      id: 1,
      steps: [
        {
          title: 'Step 1',
          description: 'This is the first step',
          trophies: [
            { name: 'Platinum Trophy', description: 'Unlock all trophies', type: 'Platinum' },
            { name: 'Gold Trophy', description: 'Defeat the final boss', type: 'Gold' },
          ],
        },
      ],
    },
  ];

  it('renders guides correctly when guides are provided', () => {
    render(<TrophyGuides guides={mockGuides} />);

    expect(screen.getByText('Trophy Guides')).toBeInTheDocument();

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('This is the first step')).toBeInTheDocument();

    expect(screen.getByText('Platinum Trophy')).toBeInTheDocument();
    expect(screen.getByText('Unlock all trophies')).toBeInTheDocument();
    expect(screen.getByText('Gold Trophy')).toBeInTheDocument();
    expect(screen.getByText('Defeat the final boss')).toBeInTheDocument();
  });

  it('renders "Δεν υπάρχουν guides" when guides list is empty', () => {
    render(<TrophyGuides guides={[]} />);

    expect(screen.getByText('❌ Δεν υπάρχουν guides για αυτό το παιχνίδι.')).toBeInTheDocument();
  });
});
