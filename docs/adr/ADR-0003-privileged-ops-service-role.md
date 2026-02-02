# ADR-0003: Privileged Operations via Service Role Isolation

**Status:** Accepted
**Date:** 2026-02-02

## Context

Supabase provides two types of access:
- **Anon/Public key:** Subject to Row-Level Security (RLS) policies
- **Service role key:** Bypasses RLS, has full database access

Some operations require bypassing RLS:
- Sitemap generation (needs to read all published articles)
- Admin operations that span multiple users
- Background jobs (TBD)

We need a strategy that enables privileged operations while minimizing security risk.

## Options

### Option A: Use Service Role Everywhere on Server

Use the service role key for all server-side operations, relying on application code to enforce access control.

**Pros:**
- Simpler Supabase client setup
- No RLS policy complexity

**Cons:**
- Single misconfigured endpoint exposes all data
- Security depends entirely on application code
- Higher blast radius if credentials leak

### Option B: Strict Service Role Isolation

Use the anon/public key by default, even on the server. Restrict service role to specific, well-audited locations.

**Pros:**
- RLS provides defense-in-depth
- Limited blast radius if application code has bugs
- Clear audit trail of privileged code paths

**Cons:**
- More Supabase client configurations to manage
- Must explicitly identify privileged operations

### Option C: Separate Service for Privileged Operations

Run privileged operations in a separate microservice with its own security boundary.

**Pros:**
- Complete isolation of privileged access
- Can have different deployment/access controls

**Cons:**
- Significant infrastructure overhead
- Overkill for current scale
- Adds latency and complexity

## Decision

**Option B: Strict Service Role Isolation**

Three Supabase clients with distinct purposes:

| Client               | Key Type     | Use Case                                |
|----------------------|--------------|-----------------------------------------|
| Browser client       | Anon/Public  | Public browser operations + auth        |
| Route handler client | Anon/Public  | API routes with cookies/token overrides |
| Server client        | Service role | Privileged operations only              |

Service role key is restricted to:
- Server client module (single file)
- Sitemap generation (build-time only)

## Consequences

**Positive:**
- Defense-in-depth through RLS enforcement
- Limited exposure if application code has vulnerabilities
- Clear identification of privileged code paths for security audits

**Negative:**
- Developers must choose the correct client for each use case
- New privileged operations require explicit justification

**Security constraint:** Service role key must never be exposed to client code or imported in client bundles.

**TBD:**
- Background job architecture may require revisiting this decision
- Admin operations access patterns need further definition
