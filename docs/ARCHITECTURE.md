# Hobbistas Architecture

Version: 1.0
Last updated: 2026-02-02

## Audience

This document is intended for developers working on Hobbistas.
It describes architectural boundaries and decisions, not implementation details.

## System Overview

Hobbistas is a media tracking and content platform that allows users to:

- Track personal media libraries (games, movies, anime, books)
- Read and publish articles (news, reviews)
- Manage backlog status and progress across media categories
- Submit and manage support tickets

## Tech Stack

| Layer          | Technology                                 |
| -------------- | ------------------------------------------ |
| Framework      | Next.js 15 (App Router)                    |
| Language       | TypeScript                                 |
| Database       | Supabase (PostgreSQL)                      |
| Auth           | Supabase Auth                              |
| State          | Redux Toolkit (global), SWR (server state) |
| Styling        | Tailwind CSS                               |
| Rich Text      | TipTap                                     |
| Deployment     | Vercel                                     |
| Analytics      | Vercel Analytics, Vercel Speed Insights    |
| Error Tracking | Sentry                                     |
| Email          | Resend                                     |

## Core Modules / Domains

### Media / Backlog

- User media library management across categories: games, movies, anime, books
- Status tracking (playing, completed, dropped, etc.)
- Progress tracking and favorites
- External API integrations: RAWG (games), TMDB (movies), MAL (anime), Google Books

### Articles

- News and reviews content
- Publishing workflow with article status
- Likes and comments system
- SEO metadata and structured data

### Support

- User support ticket submission
- Ticket lifecycle management

### Admin

- Administrative dashboard
- User management
- Content moderation
- Activity logs

### Auth

- User registration and login
- Session management
- Token syncing via `AuthInit` component
- Presence/heartbeat via `/api/activity/heartbeat`

### Profile

- User profile management
- Account settings

## Architectural Boundaries

### Client / Server Boundary

| Boundary          | Responsibility                                                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Server Components | Metadata generation, structured data, canonicalization, breadcrumbs, static content. Benefit from Next.js streaming and caching. |
| Client Components | Marked with `'use client'`. Handle DOM interactions, polling, SWR data fetching, forms, and modals.                              |

**Principle:** Use `'use client'` only where necessary. Page scaffolds and static content should remain server components.

### API Layer Boundary

API routes in `src/app/api` serve as the data access layer:

- Map directly to Supabase tables (`user_media_entries`, `activity_log`, `articles`, `support_tickets`)
- Reuse shared libraries for rate limiting and response formatting
- All mutations trigger cache invalidation via `revalidateCache`

### Cache Boundary

| Layer  | Mechanism                     | Scope                               |
| ------ | ----------------------------- | ----------------------------------- |
| Server | `revalidateCache` with tags   | Articles, games, backlog, user data |
| Client | SWR `useSWR` + `mutate`       | UI state synchronization            |
| Images | Next.js Image remote patterns | External media assets (RAWG, TMDB)  |

Server-side cache invalidation ensures data consistency; client-side SWR keeps UI in sync with server state.

### Security Boundary

- **RLS enforcement:** Supabase Row-Level Security ensures only permitted users can read/mutate their data
- **Service role isolation:** Privileged service role key is restricted to server-side operations and sitemap generation only
- **Rate limiting:** Applied at API route level to prevent abuse

## Data Access & Authorization

### Access Levels

| Level         | Description                                          |
| ------------- | ---------------------------------------------------- |
| Public        | Marketing pages, published articles, about pages     |
| Authenticated | Backlog, profile, support ticket submission          |
| Admin         | Admin dashboard, user management, content moderation |

### Row-Level Security (RLS)

Supabase RLS policies cover:

- `users` - User profile data
- `user_media_entries` - Personal media libraries
- `articles` - Content with publish state
- `admin_logs` - Administrative audit trail
- `support_tickets` - User support requests

### Supabase Clients

| Client               | Use Case                                |
| -------------------- | --------------------------------------- |
| Browser client       | Public browser operations + auth        |
| Server client        | Service role for privileged operations  |
| Route handler client | API routes with cookies/token overrides |

**Security constraint:** Service role key must never be exposed to client code.

## State Management

### Global State (Redux)

- User/session data in `authSlice`
- Theme state with `localStorage` persistence

### Feature/Local State

- Each component owns its form and interaction state
- Modals manage their own state to avoid bloating global stores
- Derived/computed data is memoized locally before render

**Principle:** Keep state as local as possible. Only lift to global when truly shared across unrelated components.

## Key Flows

### Authentication Flow

1. `AuthInit` orchestrates Supabase session checks on app load
2. Token syncing handled server-side
3. `HeartbeatPing` maintains presence via heartbeat endpoint
4. Redux stores user/session state for UI access

### Article Publishing Flow

1. Author creates/edits article via TipTap editor
2. Article saved to Supabase via API routes
3. Cache invalidated via `revalidateCache`
4. SEO metadata and structured data rendered on detail page

### Backlog / Media Tracking Flow

1. User searches media via external APIs
2. Media added to personal library via category API routes
3. Status/progress updates trigger cache invalidation
4. Activity logged for activity feed

### Support Ticket Flow

1. User submits ticket via support page
2. Ticket created in `support_tickets` table
3. Admin reviews and manages via admin dashboard

## Storage Strategy

- **User uploads:** Handled via `/api/uploads` routes
- **Media images:** Fetched from external APIs (RAWG, TMDB covers)
- **Article images:** Unknown / TBD

## Error / Observability

- **Sentry:** Error tracking and reporting
- **Rate limiting:** Applied at API route level
- **Request logging:** Centralized observability wrapper for API routes

## Deployment

- **Platform:** Vercel
- **Branch:** `deploy-vercel` triggers deployments
- **Sitemap:** Generated post-build; uses service role to fetch published articles
- **Robots:** Disallows auth/admin pages from indexing

## Project Structure Conventions

### Route Groups

```
src/app/
├── (legal)/          # Legal pages
├── (main)/           # Main application shell
│   ├── admin/        # Admin dashboard
│   ├── media/        # Media detail pages
│   └── pages/        # User-facing pages
├── api/              # API routes
└── components/       # Shared UI components
```

### API Routes

```
src/app/api/
├── activity/         # Activity logging, heartbeat
├── admin/            # Admin operations
├── articles/         # Article CRUD
├── auth/             # Auth endpoints
├── {anime,books,games,movies}/ # External API integrations
├── media/            # Generic media operations
├── support/          # Support tickets
├── uploads/          # File uploads
└── user/             # User data
```

## Non-Goals / Constraints

- **No SSR for interactive features:** Backlog, dashboards, editors use client components
- **No custom backend:** All data operations through Supabase
- **No complex caching layers:** Rely on Next.js cache + SWR + Supabase RLS
- **No offline support:** Requires network connectivity
- **External API dependency:** Media metadata relies on third-party APIs

## Open Questions / TBD

- Article image storage strategy (Supabase Storage vs external hosting)
- Full text search implementation approach
- Notification system architecture
- Mobile app considerations
- API rate limiting thresholds for external services
- Backup and disaster recovery procedures
- Content moderation workflow details
