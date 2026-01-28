<div align="center">
  <img src="public/og-image.png" alt="Hobbistas Logo" width="320">

  <h1>Hobbistas</h1>

  <p>
    <strong>A Greek hobby tracking platform for managing entertainment libraries across games, anime, movies, books and more</strong>
  </p>

  <p>
    <a href="https://platinumhunters.gr">Live Demo</a> &bull;
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

Hobbistas is a comprehensive platform for Greek hobby enthusiasts to track and manage their entertainment libraries across multiple categories. Whether you're tracking games, anime, movies, books, or TV shows - Hobbistas provides a unified experience.

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

| API              | Purpose                    |
| ---------------- | -------------------------- |
| **RAWG**         | Game metadata and search   |
| **MyAnimeList**  | Anime & manga database     |
| **TMDB**         | Movies and TV information  |
| **Google Books** | Book search and metadata   |

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

Create a `.env.local` file in the root directory:

```bash
# Required - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Required - Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional - External APIs
RAWG_API_KEY=your-rawg-key
TMDB_ACCESS_TOKEN=your-tmdb-token
MAL_CLIENT_ID=your-mal-client-id
MAL_CLIENT_SECRET=your-mal-secret
GOOGLE_BOOKS_API_KEY=your-google-books-key
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
| Method | Endpoint                | Description         |
| ------ | ----------------------- | ------------------- |
| POST   | `/api/auth/login`       | User login          |
| POST   | `/api/auth/register`    | User registration   |
| POST   | `/api/auth/logout`      | User logout         |
| GET    | `/api/auth/session`     | Get current session |
| DELETE | `/api/auth/delete-account` | Delete account   |

### Media Library (per category: anime, manga, games, movies, books)
| Method | Endpoint                    | Description                  |
| ------ | --------------------------- | ---------------------------- |
| GET    | `/api/{category}/library`   | Get user's library           |
| PATCH  | `/api/{category}/library`   | Update library entry         |
| DELETE | `/api/{category}/library`   | Remove from library          |
| GET    | `/api/{category}/search`    | Search media (local + API)   |
| POST   | `/api/{category}/add`       | Add item to library          |

### Articles
| Method | Endpoint                        | Description           |
| ------ | ------------------------------- | --------------------- |
| GET    | `/api/articles`                 | List articles         |
| POST   | `/api/articles`                 | Create article        |
| GET    | `/api/articles/[id]`            | Get article           |
| PATCH  | `/api/articles/[id]`            | Update article        |
| DELETE | `/api/articles/[id]`            | Delete article        |
| POST   | `/api/articles/[id]/like`       | Like/unlike article   |
| GET    | `/api/articles/[id]/comments`   | Get comments          |
| POST   | `/api/articles/[id]/comments`   | Add comment           |

### Other
| Method | Endpoint                 | Description              |
| ------ | ------------------------ | ------------------------ |
| GET    | `/api/activity`          | Get activity feed        |
| POST   | `/api/activity/heartbeat`| Update user presence     |
| GET    | `/api/analytics/summary` | Admin analytics          |
| GET    | `/api/user/stats`        | User statistics          |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (main)/            # Main layout group
│   │   └── pages/         # Application pages
│   ├── (legal)/           # Legal pages
│   ├── api/               # API route handlers
│   │   ├── anime/         # Anime endpoints
│   │   ├── books/         # Books endpoints
│   │   ├── games/         # Games endpoints
│   │   ├── movies/        # Movies/TV endpoints
│   │   ├── articles/      # Articles endpoints
│   │   ├── auth/          # Auth endpoints
│   │   └── ...
│   └── components/        # React components
├── store/                 # Redux store
│   ├── slices/           # Redux slices (auth)
│   └── store.ts          # Store configuration
├── lib/                   # Core libraries
│   ├── supabase/         # Database client & types
│   └── services/         # API services (RAWG, TMDB, etc)
├── types/                 # TypeScript definitions
├── utils/                 # Utility functions
└── config/               # App configuration
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

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Michalis89/Platinum-Hunters-GR)

#### Environment Variables on Vercel

| Variable                        | Required | Notes                     |
| ------------------------------- | -------- | ------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | Supabase project URL      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Supabase anonymous key    |
| `SUPABASE_SERVICE_ROLE_KEY`     | Yes      | Service role key          |
| `NEXT_PUBLIC_SITE_URL`          | Yes      | Production domain         |
| `RAWG_API_KEY`                  | No       | Game metadata             |
| `TMDB_ACCESS_TOKEN`             | No       | Movie/TV metadata         |
| `MAL_CLIENT_ID`                 | No       | Anime/manga metadata      |
| `GOOGLE_BOOKS_API_KEY`          | No       | Book metadata             |

### Database Setup

Run the migrations in order from `supabase-migrations/` folder in your Supabase SQL editor.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/description`
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Tailwind CSS utility classes

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
