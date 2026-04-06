import AdminIndexPage from '@/app/(main)/admin/page';
import { redirect } from 'next/navigation';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('AdminIndexPage', () => {
  it('redirects to /admin/support', () => {
    AdminIndexPage();

    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith('/admin/support');
  });
});
