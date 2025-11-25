import { render, screen, fireEvent } from '@testing-library/react';
import UpdateGameInfoButton from '../UpdateGameInfoButton';

describe('UpdateGameInfoButton Component', () => {
  const mockHandleUpdateInfo = jest.fn();

  it('renders when game details are missing', () => {
    render(
      <UpdateGameInfoButton
        handleUpdateInfo={mockHandleUpdateInfo}
        updating={false}
        gameDetails={{ release_year: null, developer: null, publisher: null }}
      />,
    );

    expect(screen.getByText('🔄 Get Info & Update')).toBeInTheDocument();
  });

  it('does not render when all game details are present', () => {
    render(
      <UpdateGameInfoButton
        handleUpdateInfo={mockHandleUpdateInfo}
        updating={false}
        gameDetails={{ release_year: 2023, developer: 'Naughty Dog', publisher: 'Sony' }}
      />,
    );

    expect(screen.queryByText('🔄 Get Info & Update')).not.toBeInTheDocument();
  });

  it('calls handleUpdateInfo when clicked', () => {
    render(
      <UpdateGameInfoButton
        handleUpdateInfo={mockHandleUpdateInfo}
        updating={false}
        gameDetails={{ release_year: null, developer: 'Naughty Dog', publisher: 'Sony' }}
      />,
    );

    fireEvent.click(screen.getByText('🔄 Get Info & Update'));
    expect(mockHandleUpdateInfo).toHaveBeenCalled();
  });

  it('disables button when updating is true', () => {
    render(
      <UpdateGameInfoButton
        handleUpdateInfo={mockHandleUpdateInfo}
        updating={true}
        gameDetails={{ release_year: null, developer: 'Naughty Dog', publisher: 'Sony' }}
      />,
    );

    expect(screen.getByText('🔄 Ενημέρωση...')).toBeDisabled();
  });
});
