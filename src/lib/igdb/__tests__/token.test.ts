/**
 * IGDB token stampede — in-flight guard test
 *
 * Verifies that concurrent calls to getIgdbAccessToken() result in
 * exactly ONE network request, not N duplicate requests.
 */

// Reset module state between tests (the in-flight + cache variables are module-level)
beforeEach(() => {
  jest.resetModules();
});

describe('getIgdbAccessToken – inflight guard', () => {
  it('calls fetch exactly once when invoked concurrently', async () => {
    // Arrange: stub env vars and a slow fetch
    process.env.TWITCH_CLIENT_ID = 'test-client-id';
    process.env.TWITCH_CLIENT_SECRET = 'test-client-secret';

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'tok-abc', expires_in: 3600, token_type: 'bearer' }),
      text: async () => '',
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    // Re-import after resetModules so cache/inflight start clean
    const { getIgdbAccessToken } = await import('../token');

    // Act: fire 5 concurrent calls
    const results = await Promise.all([
      getIgdbAccessToken(),
      getIgdbAccessToken(),
      getIgdbAccessToken(),
      getIgdbAccessToken(),
      getIgdbAccessToken(),
    ]);

    // Assert: only 1 HTTP request despite 5 concurrent callers
    expect(mockFetch).toHaveBeenCalledTimes(1);
    // All callers receive the same token
    expect(new Set(results).size).toBe(1);
    expect(results[0]).toBe('tok-abc');
  });

  it('returns cached token on subsequent calls without fetching again', async () => {
    process.env.TWITCH_CLIENT_ID = 'test-client-id';
    process.env.TWITCH_CLIENT_SECRET = 'test-client-secret';

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'tok-xyz', expires_in: 3600, token_type: 'bearer' }),
      text: async () => '',
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const { getIgdbAccessToken } = await import('../token');

    await getIgdbAccessToken();
    await getIgdbAccessToken();
    await getIgdbAccessToken();

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
