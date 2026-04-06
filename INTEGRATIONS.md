# External Integrations

## Architectural Principle

External APIs are **discovery and enrichment sources**, not the source of truth. The internal `media_items` table is the strategic content foundation. All integrations must reinforce the local-first model.

---

## Media Category Configurations

Defined in `src/lib/api/media/config.ts`:

| Category Key | Subcategories | External ID Field | External Source | Title Priority |
|-------------|---------------|-------------------|-----------------|---------------|
| `anime` | anime, manga | `mal_id` (number) | MyAnimeList API | title_english > title_romaji > title_native |
| `books` | books | `google_books_id` (string) | Google Books API | title > original_title |
| `games` | games | `igdb_id` (number) | IGDB API | title > title_english |
| `movies` | movies, tv | `tmdb_id` (number) | TMDB API | title > original_title > title_english > title_romaji > title_native |

---

## IGDB (Games)

**Files**: `src/lib/igdb/igdbClient.ts`, `src/lib/igdb/token.ts`, `src/lib/igdb/categories.ts`, `src/lib/services/igdbService.ts`, `src/lib/api/media/search/providers/games.ts`

**Capabilities**:
- Game search with strict and fallback modes (two-tier: category-filtered first, then broader)
- Game category filtering (`isAllowedIgdbGameCandidate`) — allowed categories: 0 (Main Game), 1 (DLC), 2 (Expansion), 3 (Bundle), 4 (Standalone Expansion), 8 (Remake), 9 (Remaster), 13, 14. Excludes titles containing "compilation", "collector", "mod", "season pass".
- Cover image URL construction: `https://images.igdb.com/igdb/image/upload/{size}/{imageId}.jpg`
- Game enrichment for external-source adds
- External games lookup: maps Steam App IDs to IGDB game IDs via `external_games` endpoint
- Rich data extraction: platforms, themes, game modes, player perspectives, developer/publisher, ratings, artwork/screenshot IDs

**Authentication**: Twitch OAuth (client credentials) with automatic token refresh. Requires `IGDB_CLIENT_ID` and `IGDB_CLIENT_SECRET` env vars. Uses IGDB Query Language (IQL) for complex queries via IGDB API v4 (`https://api.igdb.com/v4`).

**Caching**: External API responses cached via `cachedExternalFetch()` with 6-hour TTL. Stale-empty guard retries if cache returns empty array.

**Important rules**:
- Games search normalizes Roman numerals (e.g., "Final Fantasy 10" -> "Final Fantasy X") for better matching.
- The `igdb_slug` field is used as a secondary search key.
- `igdb_category` is stored on `media_items` for post-hoc filtering.

---

## TMDB (Movies & TV)

**Files**: `src/lib/tmdb/`, `src/lib/api/media/search/providers/movies.ts`

**Capabilities**:
- Movie and TV show search
- Metadata enrichment (runtime, episode counts, air dates)
- Cover image URL construction

**Authentication**: API key via `TMDB_API_KEY` env var.

---

## MyAnimeList (Anime & Manga)

**Files**: `src/lib/integrations/mal.ts`, `src/lib/api/media/search/providers/anime.ts`

**Capabilities**:
- Anime and manga search
- MAL ID matching for deduplication against local DB

**Authentication**: Via MAL API credentials.

---

## Google Books

**Files**: `src/lib/api/media/search/providers/books.ts`

**Capabilities**:
- Book search by title/author
- `google_books_id` (string) as external identifier

**Authentication**: Google Books API key.

---

## RAWG (Legacy Games)

**Files**: `src/lib/rawg/`

**Status**: Legacy integration. IGDB is the primary games API. RAWG fields (`rawg_id`) exist in the database schema but new additions use IGDB.

---

## PlayStation Network (PSN)

**Files**: Uses `psn-api` npm package.

**Capabilities**: Trophy/achievement data (used in gaming profile features).

---

## Steam

**Files**: `src/lib/integrations/steam.ts`, `src/lib/integrations/steam-sync-helpers.ts`

**Capabilities**: Steam library sync, `steam_app_id` matching.

---

## Admin Import Pipelines

**Files**: `src/app/api/admin/media/import/`

Import routes for bulk data ingestion (admin-only):

| Pipeline | Path | Source |
|----------|------|--------|
| IGDB Games | `/api/admin/media/import/igdb` | IGDB API |
| TMDB Movies/TV | `/api/admin/media/import/tmdb` | TMDB API |
| MAL Anime/Manga | `/api/admin/media/import/mal` | MAL API |
| Google Books | `/api/admin/media/import/books` | Google Books API |

These pipelines normalize and insert into `media_items` for curation.

---

## Email (Resend)

**Files**: `src/lib/email/resend.ts`, `src/lib/email/send.ts`, `src/lib/email/templates.ts`

Used for: email confirmation, password reset, notifications.

---

## Rate Limiting (Upstash Redis)

**Files**: `src/lib/rate-limit/`

- Production: Upstash Redis for shared state across serverless instances
- Development: in-memory fallback (no Redis required)
- Named limiters with per-endpoint configuration
- Rate limit headers included in responses

---

## Captcha (Cloudflare Turnstile)

**Files**: `src/lib/captcha/`

Used on: registration, potentially other public forms.

---

## Analytics

- **Vercel Analytics**: `@vercel/analytics` — production only, Vercel-hosted
- **Vercel Speed Insights**: `@vercel/speed-insights` — production only
- **Google Analytics**: Conditional on `NEXT_PUBLIC_GA_ID` env var

---

## External Image Domains

Registered in `next.config.ts` `images.remotePatterns`:

| Domain | Source |
|--------|--------|
| `image.api.playstation.com` | PSN |
| `psnobj.prod.dl.playstation.net` | PSN |
| `i.psnprofiles.com` | PSN Profiles |
| `media.rawg.io` | RAWG |
| `images.igdb.com` | IGDB |
| `cdn.cloudflare.steamstatic.com` | Steam |
| `s4.anilist.co` | AniList |
| `*.myanimelist.net` | MAL |
| `image.tmdb.org` | TMDB |
| `books.google.com` | Google Books |
| `jolfksxuhyktpwncniks.supabase.co` | Supabase Storage |
| `www.replacesmoke.com` | Vape content |
| `images.thedirect.com` | Article images |
| `c.scdn.gr` | Greek content |

Adding new external image sources requires adding them to both `next.config.ts` (remotePatterns) and potentially the service worker caching rules.

---

## Environment Variables (Required)

| Variable | Used By | Context |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase clients | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase clients | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin client | Server-only |
| `IGDB_CLIENT_ID` | IGDB API | Server-only |
| `IGDB_CLIENT_SECRET` | IGDB API | Server-only |
| `TMDB_API_KEY` | TMDB API | Server-only |
| `UPSTASH_REDIS_REST_URL` | Rate limiting | Server-only |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting | Server-only |
| `RESEND_API_KEY` | Email sending | Server-only |
| `NEXT_PUBLIC_SITE_URL` | SEO, auth redirects | Public |
| `NEXT_PUBLIC_GA_ID` | Google Analytics | Public (optional) |
