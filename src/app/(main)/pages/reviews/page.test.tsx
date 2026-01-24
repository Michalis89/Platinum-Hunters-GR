import { render, screen } from '@testing-library/react';
import ReviewPage from './page';

jest.mock('@/app/components/ui/UnderConstruction', () => {
  const MockUnderConstruction = () => (
    <div data-testid="under-construction">Under Construction</div>
  );
  MockUnderConstruction.displayName = 'MockUnderConstruction';
  return MockUnderConstruction;
});

describe('ReviewPage', () => {
  it('renders UnderConstruction component', () => {
    render(<ReviewPage />);

    const element = screen.getByTestId('under-construction');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Under Construction');
  });
});
