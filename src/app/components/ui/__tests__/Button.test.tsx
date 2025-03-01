import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders correctly with children', () => {
    render(<Button onClick={() => {}}>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    fireEvent.click(screen.getByText('Click Me'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(
      <Button onClick={handleClick} disabled>
        Disabled
      </Button>,
    );

    fireEvent.click(screen.getByText('Disabled'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies disabled styles correctly', () => {
    render(
      <Button onClick={() => {}} disabled>
        Disabled
      </Button>,
    );

    const button = screen.getByText('Disabled');

    expect(button).toHaveClass('cursor-not-allowed opacity-50');
    expect(button).toBeDisabled();
  });
});
