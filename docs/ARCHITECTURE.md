# Architecture Overview

> Platinum Hunters / Hobbistas - Next.js 15 App Router Application

## Table of Contents

- [System Overview](#system-overview)
- [Routes & Pages](#routes--pages)
- [RSC vs Client Boundaries](#rsc-vs-client-boundaries)
- [Data Access Layer](#data-access-layer)
- [Cache Strategy](#cache-strategy)
- [Auth & Session Architecture](#auth--session-architecture)
- [Error Handling](#error-handling)
- [UI Component Strategy](#ui-component-strategy)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VERCEL EDGE                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Analytics  │  Speed Insights  │  Image Optimization  │  Static Assets ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS APP ROUTER (v15)                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   RSC Pages     │  │  Client Pages   │  │     API Route Handlers      │  │
│  │  (Static/SSR)   │  │  ('use client') │  │    (43 Endpoints)           │  │
│  └────────┬────────┘  └────────┬────────┘  └─────────────┬───────────────┘  │
│           │                    │                         │                   │
│           └────────────────────┴─────────────────────────┘                   │
│                                │                                             │
│  ┌─────────────────────────────▼─────────────────────────────────────────┐  │
│  │                     REDUX TOOLKIT STORE                                │  │
│  │  ┌─────────┐ ┌─────────┐ ┌───────┐ ┌─────────┐ ┌──────────────────┐   │  │
│  │  │  Auth   │ │ Backlog │ │ Games │ │ Filters │ │ RTK Query Cache  │   │  │
│  │  └─────────┘ └─────────┘ └───────┘ └─────────┘ └──────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                          │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    SUPABASE (PostgreSQL + Auth)                        │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐    │  │
│  │  │  Database       │  │  Auth (JWT)     │  │  Storage (Images)   │    │  │
│  │  │  - users        │  │  - Sessions     │  │  - Avatars          │    │  │
│  │  │  - games        │  │  - Tokens       │  │  - Covers           │    │  │
│  │  │  - guides       │  │  - OAuth        │  │  - Guide Images     │    │  │
│  │  │  - articles     │  │                 │  │                     │    │  │
│  │  │  - user_games   │  │                 │  │                     │    │  │
│  │  │  - media_items  │  │                 │  │                     │    │  │
│  │  │  - activity_log │  │                 │  │                     │    │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    EXTERNAL APIS                                       │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐ ┌─────────────┐  │  │
│  │  │  RAWG   │ │   PSN   │ │  TMDB   │ │ MyAnimeList │ │ Google Books│  │  │
│  │  │ (Games) │ │(Trophies│ │(Movies) │ │   (Anime)   │ │   (Books)   │  │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────┘ └─────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Routes & Pages

### Page Structure (Route Groups)

```
src/app/
├── layout.tsx              # Root layout (fonts, providers, analytics)
├── (main)/                 # Main application layout group
│   ├── layout.tsx          # AppShell with Navbar + Footer
│   ├── page.tsx            # Home (/ → HomePageClient)
│   └── pages/
│       ├── about/          # /about - Static about page
│       ├── auth/
│       │   ├── login/      # /auth/login
│       │   ├── register/   # /auth/register
│       │   └── reset-password/
│       ├── backlog/        # /backlog - User game library (auth required)
│       ├── guides/
│       │   ├── page.tsx    # /guides - Browse all guides
│       │   ├── create/     # /guides/create - Create guide (auth required)
│       │   └── [slug]/     # /guides/:slug - Guide detail
│       ├── edit-guide/[id]/ # Edit existing guide
│       ├── hobbies/        # /hobbies - Multi-hobby landing
│       ├── news/
│       │   ├── page.tsx    # /news - Articles list
│       │   └── [slug]/     # /news/:slug - Article detail
│       ├── profile/
│       │   ├── page.tsx    # /profile - User profile (auth required)
│       │   └── edit/       # /profile/edit
│       ├── reviews/        # /reviews - Game reviews
│       ├── scraper/        # /scraper - Admin scraping tool (dev only)
│       └── ui-kit/         # /ui-kit - Component showcase (dev only)
│
├── (legal)/                # Legal pages layout group
│   └── pages/
│       ├── privacy/        # /privacy
│       └── terms/          # /terms
│
└── api/                    # 43 API Route Handlers
    ├── auth/               # Authentication endpoints
    ├── games/              # Game CRUD
    ├── guides/             # Guide CRUD
    ├── articles/           # Article CRUD
    ├── backlog/            # User backlog management
    ├── activity/           # Activity logging
    ├── analytics/          # Dashboard analytics
    └── [media]/            # anime, movies, books endpoints
```

### Data Dependencies by Route

| Route | Data Source | Cache Strategy | Auth |
|-------|-------------|----------------|------|
| `/` | `/api/analytics/summary` | SWR 2min | Optional |
| `/guides` | `/api/games` | Client fetch | No |
| `/guides/[slug]` | `/api/games`, `/api/guides/:id`, `/api/game-details/:id` | Client fetch | No |
| `/backlog` | `/api/backlog` | Client fetch | **Required** |
| `/profile` | Redux store + `/api/auth/session` | Redux | **Required** |
| `/news` | `/api/articles` | Client fetch | No |
| `/news/[slug]` | `/api/articles/:id` | Client fetch | No |

---

## RSC vs Client Boundaries

### Server Components (Default)
```
src/app/
├── layout.tsx              # Server - Renders shell, providers
├── (main)/
│   ├── layout.tsx          # Server - But renders client AppShell
│   ├── page.tsx            # Server - metadata export, renders client HomePageClient
│   └── pages/
│       ├── guides/
│       │   └── page.tsx    # Server - metadata only
│       └── news/
│           └── page.tsx    # Server - metadata only
```

### Client Components ('use client')
```
src/app/components/
├── AuthInit.tsx            # Client - Session validation, cookie sync
├── HeartbeatPing.tsx       # Client - Activity tracking
├── AppShell.tsx            # Client - Navigation state
├── Navbar.tsx              # Client - Auth state, mobile menu
├── home/
│   └── HomePageClient.tsx  # Client - Conditional rendering based on auth
└── All interactive components...
```

### Boundary Analysis

**Current Pattern:**
- Most pages export metadata server-side, then render a client component
- Example: `page.tsx` (server) → `HomePageClient.tsx` (client)
- This is functional but limits RSC benefits

**Potential Improvement:**
- Static pages (about, legal) could be fully server-rendered
- Guide list could use RSC with Suspense boundaries
- Article content could be pre-rendered with ISR

---

## Data Access Layer

### Supabase Client Architecture

```typescript
// Four distinct client patterns:

1. src/lib/db.ts
   └── Anonymous client (public reads)
   └── Uses: NEXT_PUBLIC_SUPABASE_ANON_KEY
   └── Purpose: Unauthenticated API routes

2. src/lib/supabase-client.ts
   └── Browser client (auto-refresh)
   └── Uses: NEXT_PUBLIC_SUPABASE_ANON_KEY
   └── Purpose: Client-side auth, real-time

3. src/lib/supabase-server.ts
   └── Server client (elevated privileges)
   └── Uses: SUPABASE_SERVICE_ROLE_KEY
   └── Purpose: Server-side operations, admin tasks
   └── Pattern: Singleton (shared across requests)  ⚠️ SERVERLESS ISSUE

4. src/lib/supabase-route-handler.ts
   └── Route handler client (per-request)
   └── Reads: sb-access-token, sb-refresh-token cookies
   └── Purpose: Authenticated API operations
```

### Database Schema Overview

```sql
-- Core Tables
users           -- User profiles (extends Supabase auth.users)
games           -- Game catalog
guides          -- Trophy guides
guide_steps     -- Guide step content
articles        -- Blog/news articles
article_views   -- View tracking
article_likes   -- Like tracking
article_comments-- Comment threads

-- User Data
user_games      -- Backlog entries (status, hours, rating)
media_items     -- Anime, movies, books, TV
user_media_entries

-- System
activity_log    -- User activity tracking
platforms       -- Gaming platforms
game_platforms  -- M:N relationship
```

### Query Patterns

```typescript
// src/lib/supabase/queries.ts

// Centralized query functions
getArticlesWithFilters(supabase, {
  category, topic, status, authorId, featured, limit, offset
})

getUserGamesWithDetails(supabase, {
  userId, limit, offset
})
```

---

## Cache Strategy

### Current Implementation

| Layer | Strategy | TTL | Invalidation |
|-------|----------|-----|--------------|
| SWR (client) | Stale-while-revalidate | 2min (analytics) | `mutate()` |
| RTK Query | Tag-based cache | Per-tag config | Tag invalidation |
| Supabase | No explicit cache | N/A | N/A |
| Next.js fetch | Not utilized | N/A | N/A |

### Where Invalidation Happens

```typescript
// Currently: Client-side only via SWR/RTK Query revalidation
// Missing: Server-side revalidateTag/revalidatePath usage

// After mutations (backlog add, article create):
// - Client refetches via SWR `mutate()`
// - No Next.js cache invalidation
```

### ISR/SSR Analysis

| Page | Current | Recommended |
|------|---------|-------------|
| `/guides` | CSR | ISR (revalidate: 3600) |
| `/guides/[slug]` | CSR | ISR (revalidate: 86400) |
| `/news` | CSR | ISR (revalidate: 600) |
| `/about` | CSR | Static |

---

## Auth & Session Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  AuthInit.tsx                                            │   │
│  │  ├─ On mount: validateSession()                         │   │
│  │  ├─ If valid: syncCookies() + fetchSession()            │   │
│  │  ├─ If invalid: forceLogout()                           │   │
│  │  ├─ onAuthStateChange listener                          │   │
│  │  ├─ Visibility/focus: quick expiry check                │   │
│  │  ├─ Interval (1min): full server validation             │   │
│  │  └─ Idle (1hr): auto-logout                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Supabase Client (supabase-client.ts)                    │   │
│  │  ├─ localStorage: platinum-hunters-auth                 │   │
│  │  ├─ Auto token refresh                                   │   │
│  │  └─ Session persistence                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVER (API Routes)                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  POST /api/auth/refresh                                  │   │
│  │  └─ Sync tokens to httpOnly cookies                      │   │
│  │      ├─ sb-access-token                                  │   │
│  │      └─ sb-refresh-token                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  createRouteHandlerClient()                              │   │
│  │  ├─ Read cookies OR Authorization header                 │   │
│  │  ├─ Set Supabase session                                 │   │
│  │  └─ Execute queries with user context                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  requireAuth(supabase)                                   │   │
│  │  └─ Throws UnauthorizedError if no session               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Session Storage

| Location | Data | Purpose |
|----------|------|---------|
| `localStorage['platinum-hunters-auth']` | Supabase session | Client persistence |
| `cookie['sb-access-token']` | JWT access token | Server-side auth |
| `cookie['sb-refresh-token']` | Refresh token | Token renewal |
| Redux `auth` slice | User profile | UI state |

### Middleware

**Current:** No `middleware.ts` file exists.

- Auth checks happen in client components (AuthInit)
- Route protection is implicit (API returns 401, client handles)

**Risk:** Protected pages can flash content before auth check completes.

---

## Error Handling

### API Error Structure

```typescript
// src/lib/api/errors.ts
export const API_ERRORS = {
  UNAUTHORIZED: { code: 401, error: 'Μη εξουσιοδοτημένη πρόσβαση', status: 401 },
  FORBIDDEN:    { code: 403, error: 'Απαγορεύεται η πρόσβαση', status: 403 },
  NOT_FOUND:    { code: 404, error: 'Δεν βρέθηκε', status: 404 },
  BAD_REQUEST:  { code: 400, error: 'Λάθος αίτημα', status: 400 },
  INTERNAL:     { code: 500, error: 'Εσωτερικό σφάλμα', status: 500 },
};

// src/lib/api/response.ts
ok<T>(data: T, init?: ResponseInit)
okWithMeta<T, M>(data: T, meta: M)
okWithPagination<T>(data: T, { page, limit, total })
fail(error, status)
```

### Error Handling Patterns

```typescript
// Route Handler Pattern
export async function GET() {
  try {
    // ... operation
    return ok(data);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, 401);
    }
    console.error('Error:', error);
    return fail(API_ERRORS.INTERNAL, 500);
  }
}
```

### Client-Side Error Handling

- Components use local `error` state
- Global error boundary: Not implemented
- Toast notifications: Via `Feedback` component

---

## UI Component Strategy

### Component Organization

```
src/app/components/
├── ui/                     # Base primitives (35+ components)
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── Card.tsx
│   ├── Skeleton.tsx
│   ├── Feedback.tsx        # Toast/alert component
│   ├── RichTextEditor.tsx  # Tiptap integration
│   └── ...
│
├── layout/                 # Layout components
│   ├── Footer.tsx
│   ├── PageContainer.tsx
│   ├── PageHeader.tsx
│   └── ...
│
├── [feature]/              # Feature-specific components
│   ├── home/
│   ├── auth/
│   ├── profile/
│   ├── guides/
│   ├── backlog/
│   ├── filters/
│   └── ...
│
└── [shared]/
    ├── AuthInit.tsx
    ├── HeartbeatPing.tsx
    ├── Navbar.tsx
    └── AppShell.tsx
```

### Design System

- **Styling:** Tailwind CSS with CSS custom properties
- **Colors:** CSS variables (`--hb-bg`, `--hb-text`, `--hb-primary`, etc.)
- **Icons:** Lucide React + React Icons
- **Animation:** Framer Motion
- **Rich Text:** Tiptap 3.17

### Component Conventions

```typescript
// Naming: PascalCase with domain prefix
GameCard.tsx        // Feature component
GameDetailsInfo.tsx // Feature-specific
Button.tsx          // Generic UI primitive

// File structure for complex components
component/
├── Component.tsx
├── Component.client.tsx  // Client-only version
├── index.ts              // Barrel export
└── __tests__/
    └── Component.test.tsx
```

---

## Key Architectural Decisions

### 1. Client-Heavy Architecture
- Most pages render client components
- Redux manages global state
- SWR/fetch for data fetching

### 2. Cookie-Based Auth for API Routes
- httpOnly cookies for security
- Synced from client Supabase session
- No middleware protection

### 3. Multiple Supabase Clients
- Different clients for different contexts
- Potential for connection issues in serverless

### 4. Activity Tracking
- Heartbeat every 5 minutes
- Full session validation every 1 minute
- Activity logging on mutations

### 5. Multi-Hobby Support
- Unified media system (games, anime, movies, books)
- Shared UI patterns across hobbies
- External API integrations per media type
