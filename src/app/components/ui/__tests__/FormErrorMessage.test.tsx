import { render, screen } from '@testing-library/react';
import FormErrorMessage from '../FormErrorMessage';

describe('FormErrorMessage Component', () => {
  it('does not render when message is undefined', () => {
    const { container } = render(<FormErrorMessage />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders correctly when message is provided', () => {
    render(<FormErrorMessage message="This is an error!" />);
    expect(screen.getByText('This is an error!')).toBeInTheDocument();
  });

  it('displays the correct error message', () => {
    render(<FormErrorMessage message="Invalid input" />);
    expect(screen.getByText('Invalid input')).toBeInTheDocument();
  });
});
