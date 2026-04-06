jest.mock('@/store/slices/authSlice', () => ({
  __esModule: true,
  default: (state = { loggedIn: false }, action: { type?: string }) => {
    if (action.type === 'AUTH/LOGIN') {
      return { ...state, loggedIn: true };
    }
    return state;
  },
}));

import { store } from '@/store/store';

describe('store', () => {
  it('creates a redux store with auth slice state', () => {
    const state = store.getState();

    expect(state).toHaveProperty('auth');
    expect(typeof store.dispatch).toBe('function');
    expect(typeof store.getState).toBe('function');
  });

  it('handles unknown actions without removing auth state', () => {
    store.dispatch({ type: '__UNKNOWN_ACTION__' });
    const nextState = store.getState();

    expect(nextState).toHaveProperty('auth');
  });
});
