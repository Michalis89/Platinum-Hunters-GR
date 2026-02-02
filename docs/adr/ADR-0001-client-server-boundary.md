# ADR-0001: Client/Server Component Boundary

**Status:** Accepted
**Date:** 2026-02-02

## Context

Hobbistas uses Next.js 15 with the App Router, which supports both Server Components and Client Components. We need a clear strategy for when to use each type to balance:

- Performance (server-side rendering, streaming, caching)
- Interactivity (DOM manipulation, real-time updates, forms)
- Bundle size (minimizing client JavaScript)

## Options

### Option A: Default to Client Components

Mark most components with `'use client'` for consistency. Use server components only for truly static pages.

**Pros:**
- Simpler mental model; everything works the same way
- Full access to hooks, browser APIs, and state everywhere

**Cons:**
- Larger client bundles
- No benefit from Next.js streaming/caching
- SEO metadata must be handled differently

### Option B: Default to Server Components, Client Only Where Necessary

Keep page scaffolds and static content as Server Components. Use `'use client'` only for components that require DOM interactions, polling, or client-side state.

**Pros:**
- Smaller client bundles
- Better SEO (metadata, structured data generated server-side)
- Benefits from Next.js streaming and caching
- Clear separation of concerns

**Cons:**
- Requires understanding component boundaries
- Some complexity when passing data between server/client

## Decision

**Option B: Default to Server Components, Client Only Where Necessary**

Server Components handle:
- Metadata generation
- Structured data and canonicalization
- Breadcrumbs
- Static content and page scaffolds

Client Components (marked with `'use client'`) handle:
- DOM interactions
- Polling and real-time updates
- SWR data fetching
- Forms and modals

## Consequences

**Positive:**
- Improved performance through reduced client bundle size
- SEO benefits from server-rendered metadata and structured data
- Clear architectural boundary for developers to follow

**Negative:**
- Developers must understand when `'use client'` is appropriate
- Data serialization required when passing props from server to client components

**Constraints:**
- Interactive features (backlog, dashboards, editors) will always be client components
- Page-level metadata and SEO must remain in server components
