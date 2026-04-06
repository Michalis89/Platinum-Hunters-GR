const signupPost = jest.fn();

jest.mock('@/app/api/auth/signup/route', () => ({
  __esModule: true,
  POST: signupPost,
}));

describe('app/api/auth/register/route', () => {
  it('re-exports POST from the signup route', async () => {
    const registerRoute = await import('@/app/api/auth/register/route');

    expect(registerRoute.POST).toBe(signupPost);
  });
});
