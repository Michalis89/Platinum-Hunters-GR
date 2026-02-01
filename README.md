<div align="center">
  <img src="public/og-image.png" alt="Hobbistas Logo" width="320">

  <h1>Hobbistas</h1>

  <p>
    <strong>A Greek hobby tracking platform for managing entertainment libraries across games, anime, movies, books and more</strong>
  </p>

  <p>
    <a href="https://hobbistas-hub.com">Live Demo</a> &bull;
    <a href="#features">Features</a> &bull;
    <a href="#getting-started">Getting Started</a> &bull;
    <a href="#deployment">Deployment</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-15.5-black?logo=next.js" alt="Next.js">
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React">
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript" alt="TypeScript">
    <img src="https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css" alt="Tailwind">
    <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase" alt="Supabase">
  </p>
</div>

---

## Overview

Hobbistas is a Greek-first hobby hub that unifies games, anime, manga, movies, TV, and books under a single backlog, activity, and editorial experience.

### Key Features

- **Multi-Hobby Libraries** - Track games, anime, manga, movies, TV shows, and books in one place
- **Unified Media System** - All hobbies use the same intuitive interface for adding, tracking, and managing items
- **External API Integration** - Auto-fetch metadata from RAWG (games), MAL (anime/manga), TMDB (movies/TV), and Google Books
- **User Profiles** - Customizable profiles with statistics, favorites, and activity history
- **Activity Feed** - Real-time personal progress tracking and status updates
- **Article System** - News, reviews, and community content with categories and topics
- **Rich Text Editor** - Create and edit articles with a full-featured Tiptap editor

---

## Tech Stack

| Layer         | Technology              |
| ------------- | ----------------------- |
| **Framework** | Next.js 15 (App Router) |
| **UI**        | React 19, Tailwind CSS  |
| **State**     | Redux Toolkit           |
| **Database**  | Supabase (PostgreSQL)   |
| **Auth**      | Supabase Auth (JWT)     |
| **Rich Text** | Tiptap                  |
| **Animation** | Framer Motion           |
| **Testing**   | Jest                    |
| **Deploy**    | Vercel                  |

### External APIs

| API              | Purpose                   |
| ---------------- | ------------------------- |
| **RAWG**         | Game metadata and search  |
| **MyAnimeList**  | Anime & manga database    |
| **TMDB**         | Movies and TV information |
| **Google Books** | Book search and metadata  |

---

## Database Schema

The application uses a unified media system:

### Core Tables

| Table                | Purpose                                     |
| -------------------- | ------------------------------------------- |
| `users`              | User accounts and profiles                  |
| `media_items`        | All media (games, anime, movies, books, tv) |
| `user_media_entries` | User's library entries with status/progress |
| `articles`           | News, reviews, community content            |
| `article_*`          | Comments, likes, views for articles         |
| `activity_log`       | User activity tracking                      |

### Media Categories

The `media_items` table supports these categories:

- `games` - Video games (via RAWG API)
- `anime` - Anime series (via MAL API)
- `manga` - Manga (via MAL API)
- `movies` - Films (via TMDB API)
- `tv` - TV series (via TMDB API)
- `books` - Books (via Google Books API)

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/Michalis89/Platinum-Hunters-GR.git
cd Platinum-Hunters-GR

# Install dependencies
npm install
```

### Environment Setup

Copy `.env.example` to `.env.local` and populate the keys below before running locally or deploying:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://XXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-public-key
SUPABASE_SERVICE_ROLE_KEY=service-role-key

# Site metadata
SITE_URL=https://platinumhunters.gr
NEXT_PUBLIC_CONTACT_EMAIL=ops@example.com

# External APIs (optional but recommended for metadata)
RAWG_API_KEY=rawg-api-key
MAL_CLIENT_ID=mal-client-id
MAL_CLIENT_SECRET=mal-client-secret
GOOGLE_BOOKS_API_KEY=google-books-key
RESEND_API_KEY=resend-api-key
```

### Development

```bash
# Start development server
npm run dev

# Run linting
npm run lint

# Run tests
npm test
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## API Endpoints

### Authentication

| Method | Endpoint                   | Description         |
| ------ | -------------------------- | ------------------- |
| POST   | `/api/auth/login`          | User login          |
| POST   | `/api/auth/register`       | User registration   |
| POST   | `/api/auth/logout`         | User logout         |
| GET    | `/api/auth/session`        | Get current session |
| DELETE | `/api/auth/delete-account` | Delete account      |

### Media Library (per category: anime, manga, games, movies, books)

| Method | Endpoint                  | Description                |
| ------ | ------------------------- | -------------------------- |
| GET    | `/api/{category}/library` | Get user's library         |
| PATCH  | `/api/{category}/library` | Update library entry       |
| DELETE | `/api/{category}/library` | Remove from library        |
| GET    | `/api/{category}/search`  | Search media (local + API) |
| POST   | `/api/{category}/add`     | Add item to library        |

### Articles

| Method | Endpoint                      | Description         |
| ------ | ----------------------------- | ------------------- |
| GET    | `/api/articles`               | List articles       |
| POST   | `/api/articles`               | Create article      |
| GET    | `/api/articles/[id]`          | Get article         |
| PATCH  | `/api/articles/[id]`          | Update article      |
| DELETE | `/api/articles/[id]`          | Delete article      |
| POST   | `/api/articles/[id]/like`     | Like/unlike article |
| GET    | `/api/articles/[id]/comments` | Get comments        |
| POST   | `/api/articles/[id]/comments` | Add comment         |

### Other

| Method | Endpoint                  | Description          |
| ------ | ------------------------- | -------------------- |
| GET    | `/api/activity`           | Get activity feed    |
| POST   | `/api/activity/heartbeat` | Update user presence |
| GET    | `/api/analytics/summary`  | Admin analytics      |
| GET    | `/api/user/stats`         | User statistics      |

---

## Project Structure

```
src/
├── app/                        # Next.js App Router (App Shell + routes)
│   ├── (main)/                 # Primary user experience (home, backlog, profile)
│   ├── (legal)/                # Privacy/terms pricing
│   ├── api/                    # Route handlers (auth, media, articles, support, activity)
│   └── components/             # Shared UI atoms, modals, loaders, editors
├── store/                      # Redux toolkit (auth slice + store)
├── context/                    # Theme/context helpers
├── lib/
│   ├── supabase/               # Clients, route helpers, types, validation
│   ├── services/               # External API adapters (RAWG, TMDB, Google Books)
│   ├── cache/                  # Cache tagging + revalidation helpers
│   ├── email/                  # Resend helpers and templates
│   └── validation/             # Shared form validators (PSN IDs, inputs)
├── config/                     # Site constants, roadmap text, SEO strings
├── utils/
│   ├── seo/                    # Metadata builders + structured data
│   └── security/               # Sanitizers (HTML, slugify)
├── data/                       # Static choices (genres, categories)
├── types/                      # Schema definitions generated from Supabase
supabase-migrations/           # SQL migrations and RLS policies
docs/private/                  # Review/Audit/Architecture playbooks
```

---

## Scripts

| Script            | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Production build         |
| `npm run start`   | Start production server  |
| `npm run lint`    | Run ESLint               |
| `npm test`        | Run Jest tests           |
| `npm run sitemap` | Generate sitemap         |

---

## Deployment & Security Notes

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Michalis89/Platinum-Hunters-GR)

Key environment variables:

| Variable                        | Required | Notes                                |
| ------------------------------- | -------- | ------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅       | Public Supabase URL                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅       | Public anon key                        |
| `SUPABASE_SERVICE_ROLE_KEY`     | ✅       | Server-only service role key          |
| `SITE_URL`                      | ✅       | Canonical domain                      |
| `RESEND_API_KEY`                | ✅       | Email provider (notifications)       |
| `RAWG_API_KEY`                  | ✳️       | Game metadata                         |
| `MAL_CLIENT_ID`                 | ✳️       | Anime/manga data                      |
| `MAL_CLIENT_SECRET`             | ✳️       | Anime/manga data                      |
| `GOOGLE_BOOKS_API_KEY`          | ✳️       | Book metadata                         |

Security posture:
1. Supabase RLS policies live under `supabase-migrations/05-create-rls-policies.sql`; service role key is exclusively used in `src/lib/supabase-server.ts` & the sitemap seed (`next-sitemap.config.js`). Never commit this key or expose it client-side.  
2. API gatekeeping uses `src/lib/api/auth.ts` + `src/lib/rate-limit.ts` (applied in `/api/auth/login` & `/api/auth/signup`) and explicit role checks for admin/uploads.  
3. File uploads leverage Supabase storage and sanitize inputs before writing. Harden stale tokens via `src/app/components/AuthInit.tsx` + `HeartbeatPing.tsx`.

### Database Setup

Run migrations sequentially from `supabase-migrations/` in the Supabase SQL editor or via `supabase db push` to rebuild the schema.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/description`
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

### How to Use the Docs

- `docs/private/REVIEW.md`: snapshot of prior production audit findings and Vercel hardening notes.  
- `docs/private/codex/ARCHITECTURE.md`: architecture map + state/data strategy.  
- `docs/private/codex/AUDIT_REPORT.md`: cleaned audit findings with severity tiers.  
- `docs/private/codex/ROADMAP.md`: 30/60/90 engineering + marketing plan and monetization tiers.

---

## License

Distributed under the MIT License. See [LICENSE.txt](LICENSE.txt) for more information.

---

<div align="center">
  <p>
    <a href="https://github.com/Michalis89/Platinum-Hunters-GR/issues">Report Bug</a> &bull;
    <a href="https://github.com/Michalis89/Platinum-Hunters-GR/issues">Request Feature</a>
  </p>
  <p>Made with care for the Greek hobby community</p>
</div>
