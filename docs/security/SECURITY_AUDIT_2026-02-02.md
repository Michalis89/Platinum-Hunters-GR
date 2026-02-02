# Hobbistas Security Audit Report

**Date:** 2026-02-02
**Auditor:** Claude Agent (AUDIT)
**Scope:** Full codebase - auth, API routes, data validation, architectural integrity
**Classification:** Internal

---

## Executive Summary

The Hobbistas codebase demonstrates solid security fundamentals including parameterized queries, HTML sanitization, and role-based access control. However, this audit identified **3 critical vulnerabilities** and **4 high-severity issues** that require immediate attention.

**Critical findings:**
1. Token refresh endpoint accepts arbitrary JWTs without validation
2. Support ticket access lacks ownership verification (IDOR)
3. In-memory rate limiting is ineffective in serverless deployment

**Risk Assessment:** MEDIUM-HIGH
**Recommendation:** Address critical and high-severity issues before next production deployment.

---

## Findings Summary

| # | Severity | Title | Score |
|---|----------|-------|-------|
| 1 | CRITICAL | Token Refresh Accepts Arbitrary JWTs | 80 |
| 2 | CRITICAL | Support Ticket IDOR - Missing Ownership Check | 72 |
| 3 | HIGH | In-Memory Rate Limiting Ineffective | 63 |
| 4 | HIGH | Account Deletion Without Confirmation | 42 |
| 5 | HIGH | Password Reset Has No Rate Limiting | 40 |
| 6 | MEDIUM | Empty Refresh Token in Session Setup | 30 |
| 7 | MEDIUM | Pagination Without Bounds | 28 |
| 8 | MEDIUM | content_rich Field Not Sanitized | 24 |
| 9 | MEDIUM | Comment Operations Ignore Article Context | 20 |
| 10 | LOW | IP Header Spoofing Possible | 15 |

**Scoring:** Impact (1-10) × Likelihood (1-10)

---

## Detailed Findings

### Finding #1: Token Refresh Accepts Arbitrary JWTs

**Severity:** CRITICAL
**CVSS Estimate:** 9.1 (Critical)
**CWE:** CWE-287 (Improper Authentication)

#### Description

The `/api/auth/refresh` endpoint accepts `access_token` and `refresh_token` from the request body and sets them directly as httpOnly cookies without any validation, signature verification, or session binding.

#### Location

**File:** `src/app/api/auth/refresh/route.ts`
**Lines:** 13-35

```typescript
async function POSTHandler(req: Request) {
  const body = await req.json();
  const { access_token, refresh_token, expires_in } = body;

  if (!access_token || !refresh_token) {
    return fail({ error: 'Λείπουν τα tokens' }, 400);
  }

  // NO VALIDATION - tokens are set directly
  cookieStore.set('sb-access-token', access_token, cookieOptions);
  cookieStore.set('sb-refresh-token', refresh_token, cookieOptions);
}
```

#### Impact

- Complete session hijacking capability
- Attacker can impersonate any user by injecting forged tokens
- No authentication required to exploit

#### Proof of Concept

```bash
curl -X POST https://hobbistas.gr/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"access_token":"malicious.jwt.here","refresh_token":"fake","expires_in":3600}'
```

#### Remediation

1. Verify caller has existing valid session before accepting new tokens
2. Validate new tokens via Supabase before setting cookies
3. Ensure token belongs to same user as current session

```typescript
async function POSTHandler(req: Request) {
  const supabase = await createRouteHandlerClient();
  const { data: { session: currentSession } } = await supabase.auth.getSession();

  if (!currentSession) {
    return fail({ error: 'No active session' }, 401);
  }

  const { access_token, refresh_token } = await req.json();

  // Validate new token before accepting
  const { data: { user }, error } = await supabase.auth.getUser(access_token);
  if (error || user?.id !== currentSession.user.id) {
    return fail({ error: 'Invalid token' }, 401);
  }

  // Now safe to set cookies
  // ...
}
```

#### Verification Tests

- [ ] Send arbitrary JWT strings → should reject with 401
- [ ] Send valid JWT for different user → should reject with 401
- [ ] Send expired JWT → should reject with 401
- [ ] Send valid JWT for current user → should succeed

---

### Finding #2: Support Ticket IDOR - Missing Ownership Check

**Severity:** CRITICAL
**CVSS Estimate:** 7.5 (High)
**CWE:** CWE-639 (Authorization Bypass Through User-Controlled Key)

#### Description

The GET endpoint for `/api/support/tickets/[id]` verifies authentication but does not verify the ticket belongs to the requesting user, allowing any authenticated user to access any support ticket.

#### Location

**File:** `src/app/api/support/tickets/[id]/route.ts`
**Lines:** 8-24

```typescript
async function GETHandler(_req: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createRouteHandlerClient();
  await requireAuth(supabase);  // Only checks authentication

  const { id: ticketId } = await context.params;

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)  // NO user_id filter
    .single();
```

#### Impact

- Any authenticated user can read any support ticket
- Exposure of private user communications
- Potential exposure of sensitive attachments
- Privacy violation / GDPR concerns

#### Proof of Concept

1. Authenticate as User A
2. Request `GET /api/support/tickets/1` (ticket belongs to User B)
3. Receive full ticket details including messages and attachments

#### Remediation

```typescript
async function GETHandler(_req: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createRouteHandlerClient();
  const session = await requireAuth(supabase);

  const { id: ticketId } = await context.params;

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .eq('user_id', session.user.id)  // ADD THIS
    .single();

  if (!ticket) {
    return fail(API_ERRORS.NOT_FOUND, 404);
  }
  // ...
}
```

#### Verification Tests

- [ ] User A requests User B's ticket → should return 404
- [ ] User requests own ticket → should succeed
- [ ] Admin requests any ticket → should succeed (if admin bypass is intended)

---

### Finding #3: In-Memory Rate Limiting Ineffective in Serverless

**Severity:** HIGH
**CVSS Estimate:** 5.3 (Medium)
**CWE:** CWE-799 (Improper Control of Interaction Frequency)

#### Description

Rate limiting uses an in-memory `Map` that resets with each serverless function instance. On Vercel, requests hit different instances, making rate limits ineffective.

#### Location

**File:** `src/lib/rate-limit.ts`
**Lines:** 21-24

```typescript
// In-memory store (per-instance in serverless)
const rateLimitStore = new Map<string, RateLimitEntry>();
```

#### Impact

- Login brute force attacks possible
- Registration spam not prevented
- Password reset flooding not prevented
- API abuse not mitigated

#### Remediation

Migrate to persistent storage. Options:

**Option A: Upstash Redis (Recommended)**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'),
});
```

**Option B: Vercel KV**
```typescript
import { kv } from '@vercel/kv';

async function rateLimit(identifier: string, config: RateLimitConfig) {
  const key = `ratelimit:${identifier}`;
  const current = await kv.incr(key);
  if (current === 1) {
    await kv.expire(key, config.windowMs / 1000);
  }
  return { success: current <= config.limit, remaining: config.limit - current };
}
```

#### Verification Tests

- [ ] Send 100 login attempts rapidly → verify consistent blocking
- [ ] Trigger cold start (wait 5+ min) → verify limits persist
- [ ] Hit different regions → verify shared state

---

### Finding #4: Account Deletion Without Confirmation

**Severity:** HIGH
**CVSS Estimate:** 6.5 (Medium)
**CWE:** CWE-862 (Missing Authorization)

#### Description

The `/api/auth/delete-account` endpoint permanently deletes accounts with a single POST request. No rate limiting, CAPTCHA, email confirmation, or password re-entry required.

#### Location

**File:** `src/app/api/auth/delete-account/route.ts`
**Lines:** 9-35

#### Impact

- Session hijacking leads to permanent account deletion
- CSRF attacks could delete accounts
- No recovery path for accidental deletions
- Race condition: deletes user table before auth (partial failure leaves orphans)

#### Remediation

```typescript
async function POSTHandler(req: Request) {
  const supabase = await createRouteHandlerClient();
  const session = await requireAuth(supabase);

  // Rate limit
  const rateLimitResult = rateLimit(`delete:${session.user.id}`, { limit: 1, windowMs: 3600000 });
  if (!rateLimitResult.success) {
    return fail({ error: 'Too many attempts' }, 429);
  }

  // Require password confirmation
  const { password } = await req.json();
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: session.user.email,
    password,
  });
  if (authError) {
    return fail({ error: 'Invalid password' }, 401);
  }

  // Soft delete first
  await supabase.from('users').update({
    account_status: 'pending_deletion',
    deletion_requested_at: new Date().toISOString()
  }).eq('id', session.user.id);

  // Send confirmation email with cancellation link
  // Hard delete via scheduled job after 30 days
}
```

#### Verification Tests

- [ ] Attempt deletion without password → should fail
- [ ] Attempt rapid deletions → should rate limit
- [ ] Verify soft delete before hard delete
- [ ] Verify recovery email sent

---

### Finding #5: Password Reset Has No Rate Limiting

**Severity:** HIGH
**CVSS Estimate:** 5.3 (Medium)
**CWE:** CWE-799 (Improper Control of Interaction Frequency)

#### Description

The `/api/auth/forgot-password` endpoint has no rate limiting, allowing unlimited password reset requests.

#### Location

**File:** `src/app/api/auth/forgot-password/route.ts`
**Lines:** 11-53

#### Impact

- Email flooding (harassment)
- Email enumeration via timing differences
- Resend API cost exhaustion

#### Remediation

```typescript
async function POSTHandler(req: Request) {
  const clientIp = getClientIp(req);
  const rateLimitResult = rateLimit(`forgot:${clientIp}`, { limit: 3, windowMs: 3600000 });
  if (!rateLimitResult.success) {
    return fail({ error: 'Too many requests' }, 429, {
      headers: rateLimitHeaders(rateLimitResult),
    });
  }
  // ... existing code
}
```

#### Verification Tests

- [ ] Send 10 requests for same email → should block after 3
- [ ] Wait 1 hour → should reset limit

---

### Finding #6: Empty Refresh Token in Session Setup

**Severity:** MEDIUM
**CVSS Estimate:** 4.3 (Medium)
**CWE:** CWE-754 (Improper Check for Unusual or Exceptional Conditions)

#### Description

When `refreshToken` is undefined, the code passes an empty string to `setSession()`, which may cause unexpected Supabase behavior.

#### Location

**File:** `src/lib/supabase-route-handler.ts`
**Lines:** 52-56

```typescript
await supabase.auth.setSession({
  access_token: accessToken,
  refresh_token: refreshToken || '',  // Empty string if undefined
});
```

#### Remediation

```typescript
if (accessToken && refreshToken) {
  await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
} else if (accessToken) {
  // Handle access-token-only case explicitly
  // Or skip setSession entirely for short-lived operations
}
```

---

### Finding #7: Pagination Without Bounds

**Severity:** MEDIUM
**CVSS Estimate:** 4.3 (Medium)
**CWE:** CWE-400 (Uncontrolled Resource Consumption)

#### Description

Multiple endpoints accept `limit` parameter without maximum bounds.

#### Locations

- `src/app/api/articles/[id]/comments/route.ts:20-21`
- `src/app/api/admin/support/tickets/route.ts`
- Other listing endpoints

```typescript
const limit = parseInt(searchParams.get('limit') || '20');  // No max!
```

#### Remediation

```typescript
const MAX_LIMIT = 100;
const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), MAX_LIMIT);
const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
```

---

### Finding #8: content_rich Field Not Sanitized

**Severity:** MEDIUM
**CVSS Estimate:** 5.4 (Medium)
**CWE:** CWE-79 (Cross-site Scripting)

#### Description

Only `content_html` is sanitized; `content_rich` (TipTap JSON) is stored as-is. If rendered without sanitization, XSS is possible.

#### Location

**File:** `src/app/api/articles/route.ts`
**Lines:** 109-141

#### Remediation

1. Validate `content_rich` matches expected TipTap JSON schema
2. Sanitize when converting content_rich to HTML on render
3. Add schema validation:

```typescript
import { z } from 'zod';

const TipTapNodeSchema = z.object({
  type: z.string(),
  content: z.array(z.lazy(() => TipTapNodeSchema)).optional(),
  text: z.string().optional(),
  marks: z.array(z.object({ type: z.string() })).optional(),
});

const content_rich_parsed = TipTapNodeSchema.safeParse(JSON.parse(content_rich));
if (!content_rich_parsed.success) {
  return fail({ error: 'Invalid content format' }, 400);
}
```

---

### Finding #9: Comment Operations Ignore Article Context

**Severity:** MEDIUM
**CVSS Estimate:** 4.3 (Medium)
**CWE:** CWE-639 (Authorization Bypass)

#### Description

DELETE and PATCH for comments accept `commentId` but don't verify the comment belongs to the article in the URL path.

#### Location

**File:** `src/app/api/articles/[id]/comments/route.ts`
**Lines:** 124-249

#### Remediation

```typescript
// In DELETEHandler and PATCHHandler, add article verification:
const { id: articleId } = await params;

const { data: comment } = await supabase
  .from('article_comments')
  .select('*')
  .eq('id', commentId)
  .eq('article_id', Number.parseInt(articleId, 10))  // ADD THIS
  .single();
```

---

### Finding #10: IP Header Spoofing Possible

**Severity:** LOW
**CVSS Estimate:** 3.7 (Low)
**CWE:** CWE-290 (Authentication Bypass by Spoofing)

#### Description

`getClientIp()` trusts `x-forwarded-for` header which could be spoofed depending on proxy configuration.

#### Location

**File:** `src/lib/rate-limit.ts`
**Lines:** 117-132

#### Remediation

Vercel properly handles these headers at the edge, but for defense in depth:

```typescript
export function getClientIp(request: Request): string {
  // Prefer Vercel's verified header
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  if (vercelIp) return vercelIp.split(',')[0].trim();

  // Fallback chain
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  return 'unknown';
}
```

---

## Positive Findings

The following security controls are properly implemented:

| Control | Implementation | Status |
|---------|---------------|--------|
| HTML Sanitization | `sanitize-html` with strict whitelist | ✓ Strong |
| SQL Injection Prevention | Supabase parameterized queries | ✓ Strong |
| Role-Based Access Control | `hasAnyRole()` checks on admin routes | ✓ Good |
| CAPTCHA | Turnstile on registration/login | ✓ Good |
| Secure Cookies | httpOnly, secure, sameSite flags | ✓ Good |
| File Upload Validation | Type whitelist, size limits, filename sanitization | ✓ Good |
| Database RLS | Row-level security policies | ✓ Good |
| Password Validation | Length, complexity requirements | ✓ Good |
| Input Validation | Zod schemas, text validators | ✓ Good |

---

## Remediation Priority

### Immediate (Before Next Deploy)

1. **[CRITICAL]** Add token validation to `/api/auth/refresh`
2. **[CRITICAL]** Add user_id filter to support ticket GET
3. **[HIGH]** Add rate limiting to forgot-password

### Short-Term (Within 1 Week)

4. **[HIGH]** Migrate rate limiting to Upstash Redis
5. **[HIGH]** Add confirmation flow to account deletion
6. **[MEDIUM]** Implement pagination limits

### Medium-Term (Within 1 Month)

7. **[MEDIUM]** Validate content_rich JSON structure
8. **[MEDIUM]** Add article context to comment operations
9. **[MEDIUM]** Fix empty refresh token handling
10. **[LOW]** Review IP extraction logic

---

## Appendix A: Test Cases

### Critical Path Tests

```typescript
describe('Security: Auth Refresh', () => {
  it('rejects arbitrary JWT tokens', async () => {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ access_token: 'fake', refresh_token: 'fake' }),
    });
    expect(res.status).toBe(401);
  });

  it('rejects tokens for different user', async () => {
    // Login as User A, try to set User B's token
  });
});

describe('Security: Support Tickets', () => {
  it('prevents access to other users tickets', async () => {
    // Authenticate as User A
    const res = await fetch('/api/support/tickets/999'); // User B's ticket
    expect(res.status).toBe(404);
  });
});

describe('Security: Rate Limiting', () => {
  it('blocks after threshold exceeded', async () => {
    for (let i = 0; i < 10; i++) {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      });
    }
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    expect(res.status).toBe(429);
  });
});
```

---

## Appendix B: References

- OWASP Top 10 2021: https://owasp.org/Top10/
- CWE Database: https://cwe.mitre.org/
- Supabase Security Best Practices: https://supabase.com/docs/guides/auth/security
- Next.js Security: https://nextjs.org/docs/advanced-features/security-headers

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-02 | Claude Agent (AUDIT) | Initial audit |

---

**End of Report**
