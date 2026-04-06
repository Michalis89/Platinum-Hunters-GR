/**
 * @jest-environment node
 */

import { rateLimit, getClientIp, rateLimitHeaders, RATE_LIMITS } from './rate-limit';

describe('rate-limit', () => {
  // Reset the rate limit store between tests by using unique identifiers
  const testId = () => `test-${Date.now()}-${Math.random()}`;

  describe('rateLimit', () => {
    it('should allow requests under the limit', () => {
      const id = testId();
      const config = { limit: 3, windowMs: 60_000 };

      const result1 = rateLimit(id, config);
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(2);
      expect(result1.limit).toBe(3);

      const result2 = rateLimit(id, config);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(1);

      const result3 = rateLimit(id, config);
      expect(result3.success).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it('should block requests over the limit', () => {
      const id = testId();
      const config = { limit: 2, windowMs: 60_000 };

      rateLimit(id, config); // 1
      rateLimit(id, config); // 2

      const result = rateLimit(id, config); // 3 - should be blocked
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should track different identifiers separately', () => {
      const id1 = testId();
      const id2 = testId();
      const config = { limit: 1, windowMs: 60_000 };

      const result1 = rateLimit(id1, config);
      expect(result1.success).toBe(true);

      const result2 = rateLimit(id2, config);
      expect(result2.success).toBe(true);

      // id1 should now be blocked
      const result3 = rateLimit(id1, config);
      expect(result3.success).toBe(false);

      // id2 should also be blocked
      const result4 = rateLimit(id2, config);
      expect(result4.success).toBe(false);
    });

    it('should include reset timestamp in the future', () => {
      const id = testId();
      const config = { limit: 5, windowMs: 60_000 };
      const before = Date.now();

      const result = rateLimit(id, config);

      expect(result.reset).toBeGreaterThan(before);
      expect(result.reset).toBeLessThanOrEqual(before + config.windowMs + 100);
    });
  });

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
      });

      expect(getClientIp(request)).toBe('1.2.3.4');
    });

    it('should extract IP from cf-connecting-ip header', () => {
      const request = new Request('http://localhost', {
        headers: { 'cf-connecting-ip': '1.2.3.4' },
      });

      expect(getClientIp(request)).toBe('1.2.3.4');
    });

    it('should extract IP from x-real-ip header', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '1.2.3.4' },
      });

      expect(getClientIp(request)).toBe('1.2.3.4');
    });

    it('should return unknown when no IP headers present', () => {
      const request = new Request('http://localhost');

      expect(getClientIp(request)).toBe('unknown');
    });

    it('should prefer x-forwarded-for over other headers', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '1.1.1.1',
          'cf-connecting-ip': '2.2.2.2',
          'x-real-ip': '3.3.3.3',
        },
      });

      expect(getClientIp(request)).toBe('1.1.1.1');
    });
  });

  describe('rateLimitHeaders', () => {
    it('should include standard rate limit headers', () => {
      const result = {
        success: true,
        remaining: 5,
        reset: Date.now() + 60000,
        limit: 10,
      };

      const headers = rateLimitHeaders(result);

      expect(headers['X-RateLimit-Limit']).toBe('10');
      expect(headers['X-RateLimit-Remaining']).toBe('5');
      expect(headers['X-RateLimit-Reset']).toBeDefined();
    });

    it('should include Retry-After header when blocked', () => {
      const resetTime = Date.now() + 30000;
      const result = {
        success: false,
        remaining: 0,
        reset: resetTime,
        limit: 10,
      };

      const headers = rateLimitHeaders(result);

      expect(headers['Retry-After']).toBeDefined();
      expect(Number(headers['Retry-After'])).toBeGreaterThan(0);
      expect(Number(headers['Retry-After'])).toBeLessThanOrEqual(30);
    });

    it('should not include Retry-After header when allowed', () => {
      const result = {
        success: true,
        remaining: 5,
        reset: Date.now() + 60000,
        limit: 10,
      };

      const headers = rateLimitHeaders(result);

      expect(headers['Retry-After']).toBeUndefined();
    });
  });

  describe('RATE_LIMITS presets', () => {
    it('should have sensible defaults', () => {
      expect(RATE_LIMITS.login.limit).toBe(5);
      expect(RATE_LIMITS.login.windowMs).toBe(15 * 60_000);

      expect(RATE_LIMITS.register.limit).toBe(3);
      expect(RATE_LIMITS.register.windowMs).toBe(60 * 60_000);

      expect(RATE_LIMITS.api.limit).toBe(100);
      expect(RATE_LIMITS.api.windowMs).toBe(60_000);
    });
  });
});
