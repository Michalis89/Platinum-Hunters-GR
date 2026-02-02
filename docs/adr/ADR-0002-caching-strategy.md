# ADR-0002: Caching Strategy

**Status:** Accepted
**Date:** 2026-02-02

## Context

Hobbistas fetches data from multiple sources:
- Supabase (user data, articles, media entries)
- External APIs (RAWG, TMDB, MAL, Google Books)
- Static assets and images

We need a caching strategy that ensures data consistency after mutations while maintaining good performance.

## Options

### Option A: Single Cache Layer (Client-Only with SWR)

Use SWR exclusively for all data fetching. Server components fetch fresh data on each request.

**Pros:**
- Simple implementation
- SWR handles revalidation automatically

**Cons:**
- No server-side caching benefits
- Repeated fetches for the same data across requests
- Higher load on Supabase and external APIs

### Option B: Dual Cache Layer (Server Tags + Client SWR)

Use Next.js cache tags with `revalidateCache` for server-side caching. Use SWR on the client for UI state synchronization.

**Pros:**
- Server cache reduces database/API load
- Tag-based invalidation ensures consistency after mutations
- Client SWR keeps UI responsive and in sync
- Clear separation: server handles data consistency, client handles UI state

**Cons:**
- Two caching mechanisms to understand
- Must remember to invalidate cache on mutations

### Option C: External Cache (Redis/Memcached)

Add a dedicated caching layer outside of Next.js.

**Pros:**
- Fine-grained control over cache behavior
- Shared cache across multiple instances

**Cons:**
- Additional infrastructure complexity
- Overkill for current scale
- More moving parts to maintain

## Decision

**Option B: Dual Cache Layer (Server Tags + Client SWR)**

| Layer  | Mechanism                   | Scope                               |
|--------|-----------------------------|-------------------------------------|
| Server | `revalidateCache` with tags | Articles, games, backlog, user data |
| Client | SWR `useSWR` + `mutate`     | UI state synchronization            |
| Images | Next.js Image remote patterns | External media assets (RAWG, TMDB) |

All mutations in API routes must call `revalidateCache` for affected tags.

## Consequences

**Positive:**
- Reduced load on Supabase and external APIs
- Consistent data after mutations via tag invalidation
- Responsive UI through SWR's optimistic updates and revalidation

**Negative:**
- Developers must remember to invalidate appropriate cache tags on mutations
- Two mental models for caching (server vs client)

**Constraints:**
- No complex external caching infrastructure
- Cache invalidation is the responsibility of API route handlers
