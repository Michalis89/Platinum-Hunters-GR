import { render, screen } from '@testing-library/react';
import { Card, CardContent } from '../Card';

describe('Card Component', () => {
  it('renders correctly with children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies additional className', () => {
    render(<Card className="custom-class">Styled Card</Card>);
    const cardElement = screen.getByText('Styled Card');

    expect(cardElement).toHaveClass('custom-class');
  });
});

describe('CardContent Component', () => {
  it('renders correctly with children', () => {
    render(<CardContent>Inner Content</CardContent>);
    expect(screen.getByText('Inner Content')).toBeInTheDocument();
  });
});
