import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dropdown from '../Dropdown';

describe('Dropdown Component', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1', icon: <span data-testid="icon-1">🔥</span> },
    { value: 'option2', label: 'Option 2', icon: <span data-testid="icon-2">🚀</span> },
  ];

  const mockOnSelect = jest.fn();

  it('renders correctly with label', () => {
    render(
      <Dropdown
        label="Select an option"
        options={mockOptions}
        selectedValue=""
        onSelect={mockOnSelect}
        isOpen={false}
        zIndex={10}
      />,
    );

    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('opens and closes when clicking the button', async () => {
    render(
      <Dropdown
        label="Dropdown"
        options={mockOptions}
        selectedValue=""
        onSelect={mockOnSelect}
        isOpen={false}
        zIndex={10}
      />,
    );

    const dropdownButton = screen.getByTestId('dropdown');

    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();

    fireEvent.click(dropdownButton);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();

    fireEvent.click(dropdownButton);

    await waitFor(() => expect(screen.queryByText('Option 1')).not.toBeInTheDocument());
  });

  it('calls onSelect when an option is clicked', () => {
    render(
      <Dropdown
        label="Dropdown"
        options={mockOptions}
        selectedValue=""
        onSelect={mockOnSelect}
        isOpen={false}
        zIndex={10}
      />,
    );

    fireEvent.click(screen.getByTestId('dropdown'));

    fireEvent.click(screen.getByText('Option 1'));

    expect(mockOnSelect).toHaveBeenCalledWith('option1');
  });
});
