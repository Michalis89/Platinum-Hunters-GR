import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '../SearchBar';

describe('SearchBar Component', () => {
  it('renders correctly', () => {
    render(<SearchBar search="" setSearch={jest.fn()} />);
    expect(screen.getByPlaceholderText('🔎 Αναζήτηση παιχνιδιού...')).toBeInTheDocument();
  });

  it('displays the correct search value', () => {
    render(<SearchBar search="Elden Ring" setSearch={jest.fn()} />);
    expect(screen.getByDisplayValue('Elden Ring')).toBeInTheDocument();
  });

  it('calls setSearch on input change', () => {
    const mockSetSearch = jest.fn();
    render(<SearchBar search="" setSearch={mockSetSearch} />);

    const input = screen.getByPlaceholderText('🔎 Αναζήτηση παιχνιδιού...');
    fireEvent.change(input, { target: { value: 'God of War' } });

    expect(mockSetSearch).toHaveBeenCalledTimes(1);
    expect(mockSetSearch).toHaveBeenCalledWith('God of War');
  });
});
