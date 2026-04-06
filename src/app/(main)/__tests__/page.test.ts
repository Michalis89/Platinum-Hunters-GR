import RootPage from '@/app/(main)/page';
import { permanentRedirect } from 'next/navigation';

jest.mock('next/navigation', () => ({
  permanentRedirect: jest.fn(),
}));

describe('RootPage', () => {
  it('permanently redirects to /home', () => {
    RootPage();

    expect(permanentRedirect).toHaveBeenCalledTimes(1);
    expect(permanentRedirect).toHaveBeenCalledWith('/home');
  });
});
