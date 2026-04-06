# Core Architecture

Hobbistas follows a **core + opt-in feature architecture**.

## Core Platform

The following domains form the stable application kernel and must remain stable:

| Domain | Key Paths | Notes |
|--------|-----------|-------|
| Authentication | `src/store/slices/authSlice.ts`, `src/lib/auth/`, `src/lib/supabase/` | Supabase email/password, Redux for session state, `/api/me` for hydration |
| User Profile | `src/app/(main)/profile/`, `src/lib/profile/`, `src/types/user.ts` | Includes category profiles, genre affinity, privacy settings |
| Dashboard | `src/app/(main)/dashboard/`, `src/lib/dashboard/` | User-specific aggregated view |
| Media Entity Model | `src/lib/api/media/`, `src/lib/types/media.ts`, `src/types/database.ts` | Unified `media_items` table, factory-based API routes |
| Backlog / Library | `src/app/(main)/backlog/`, `src/app/api/{category}/library/` | `user_media_entries` with status tracking |
| Design System | `src/components/ui/`, `src/app/globals.css`, `tailwind.config.ts` | shadcn/ui Radix primitives, violet-bloom theme |
| Navigation Shell | `src/app/components/shell/`, `src/app/components/navbar/` | AppShell + sidebar layout |
| PWA / Offline | `next.config.ts` (workbox), `src/worker/`, `src/lib/pwa/`, `src/app/offline/` | Service worker with caching strategies |

## Opt-In Feature Modules

Additional hobby verticals are treated as opt-in feature modules:

| Feature | Key Paths | Coupling | Feature Flag |
|---------|-----------|----------|-------------|
| D&D Campaigns | `src/app/(main)/dnd/` | Low — isolated, own tables (`dnd_campaigns`, `dnd_campaign_members`, etc.) | `settings.dnd_enabled` |
| Personal Diary | `src/app/(main)/diary/`, `src/lib/diary/` | Medium — uses auth, has own crypto layer | `settings.diary_enabled` |
| Social Layer | `src/app/(main)/u/[username]/`, `src/app/(main)/share/` | Medium — reads from core user/backlog data, token-based public access (`share_tokens` table) | `settings.social_profile_enabled` |
| Support Tickets | `src/app/(main)/support/`, `src/app/(main)/admin/support/` | Low — isolated, own tables (`support_tickets`, `support_messages`, `support_attachments`) | Always available |
| Explore / Discovery | `src/app/(main)/explore/` | Medium — reads from activity, recommendations, profiles | `settings.community_suggestions_enabled`, `community_activity_enabled` |
| Recommendations | `src/lib/recommendations/v2/` | Medium — multi-factor scoring engine using genre affinity, themes, platform prefs, completion rates | N/A (internal service) |
| Reviews | `src/app/(main)/review/` | Medium — built on article infrastructure, filters by `topic: 'reviews'` | `settings.reviews_enabled` |

Feature flags are stored in a `user_settings` table and checked at the page level — disabled features redirect to settings.

Opt-in modules should be:
- Lazy-loaded where possible
- Isolated behind clear boundaries
- Removable without destabilizing the core platform
- Designed as additive feature slices
- New hobby verticals must follow this same pattern

## State Management Architecture

```
┌─────────────────────────────────────────────────────┐
│ Root Layout                                         │
│  ├─ LocaleProvider (React Context)                  │
│  └─ Providers (client boundary)                     │
│      ├─ Redux Provider (auth state only)            │
│      ├─ SWR Config (data fetching)                  │
│      ├─ ThemeProvider (dark/light via cookies)       │
│      └─ Toaster (sonner)                            │
└─────────────────────────────────────────────────────┘
```

- **Redux**: `authSlice` only. Contains user session, roles, role-derived selectors (`selectCanQuickAdd`, `selectCanAccessAdminPanel`, etc.). Do not add new slices for data fetching.
- **SWR**: Client-side data fetching with centralized config. Used for library data, search results, etc.
- **Server Components**: Default for pages. Use `supabase-server.ts` for data loading.
- **React Context**: `ThemeContext` (dark/light), `LocaleContext` (browser locale).

## API Route Architecture

All API routes follow these patterns:

1. **Observability**: Every handler is wrapped in `withApiRoute` which logs request method, path, status, and duration.
2. **Auth check**: Use `requireAuth(supabase)` from `src/lib/api/auth` or `requireServerAuth()` from `src/lib/auth/requireServerAuth.ts`.
3. **Rate limiting**: Named Upstash limiters for sensitive endpoints (auth, support). In-memory fallback for dev.
4. **Response format**: `NextResponse.json({ data })` for success, `NextResponse.json({ error }, { status })` for errors.

### Media API Factory

The media system uses a factory pattern to eliminate duplication:

```
src/lib/api/media/
├── config.ts          # Per-category configuration (anime, books, games, movies)
├── factories.ts       # createMediaAddRoute, createMediaLibraryRoute, createMediaSearchRoute
├── types.ts           # Shared type definitions
├── handlers/
│   ├── add.ts         # Generic add handler (local + external sources)
│   ├── library.ts     # Generic CRUD handler
│   ├── search.ts      # Generic search handler (local-first)
│   ├── suggestions.ts # Recommendation suggestions
│   └── enrichers.ts   # Category-specific data enrichment
├── search/providers/  # Per-category search config (anime, books, games, movies)
└── utils/             # Title resolution, media lookup helpers
```

Each category's API route is a thin file that calls the factory:
```typescript
// src/app/api/anime/add/route.ts
export const { POST } = createMediaAddRoute('anime');
```

## Caching Architecture

### Server-Side (Next.js)
- Tag-based cache invalidation via `src/lib/cache/tags.ts`
- `CACHE_TAGS` constants for consistent naming
- `revalidateCache` helpers triggered after mutations
- Public data: 5-minute revalidation. User data: 1-minute. Realtime: no cache.

### Client-Side (PWA / Service Worker)
- Auth/admin/me routes: `NetworkOnly` (never cached)
- Public API routes: `StaleWhileRevalidate` (10-min expiry)
- Static assets: `CacheFirst` (1-year expiry)
- Supabase REST: `NetworkFirst` (5-min fallback)
- External media images: `CacheFirst` (14-day, 500 entries max)

### Cache-Control Headers
- `/api/auth/*`, `/api/admin/*`, `/api/me/*`: `no-store` (set in `next.config.ts` headers)

## Content Acquisition Architecture

Hobbistas uses a **local-first content architecture with external API augmentation**.

### Search Behavior

1. Check the local database first (`media_items` table).
2. If a matching entity exists locally, return as the preferred source.
3. If no suitable local entity exists, query external APIs.
4. Normalize external results before presenting or storing.
5. Deduplicate by external ID to prevent duplicates when local and external results overlap.

### Add Behavior

1. For `source: 'local'` — upsert `user_media_entries` directly.
2. For `source: 'external'` — find or insert into `media_items` first (with optional enrichment), then upsert `user_media_entries`.
3. After add: background-recompute genre affinity and category profiles, log activity.

### Curation Model

Admin curation layer for improving internal content quality:
- Manual: admin workflows for data curation
- Import pipelines: bulk import from IGDB, TMDB, MAL, Google Books
- Purpose: metadata quality, consistency, deduplication, API independence

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `users` | User accounts with profile, settings, roles |
| `media_items` | Unified media entity model (all categories) |
| `user_media_entries` | Per-user library tracking (status, score, progress) |
| `articles` | Content items (articles, reviews, tutorials) |
| `article_likes` | Article like tracking |
| `diary_entries` | Encrypted diary entries (ciphertext only on server) |
| `activity_log` | User activity tracking |
| `user_category_profiles` | Derived per-category profile data |

## Role-Based Access Control

```
owner > admin > moderator > reviewer > author > user
```

| Permission | Required Role |
|-----------|--------------|
| Admin panel access | admin, moderator, owner |
| Quick-add media | admin, author, reviewer, owner |
| Edit articles | admin, author, reviewer, owner |
| Data curation | admin, owner |
| Full admin | admin, owner |

Role checks are centralized in `src/lib/roles.ts`. Redux selectors in `authSlice.ts` derive UI-level permissions.
