# Product Academy

> A mobile-first learning platform that helps aspiring Product Managers build practical skills, practice with AI, and stay connected to an instructor.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111827)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL- Drizzle-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## Why this project

Product Academy is a portfolio project built around a real product problem: career education is more useful when lessons, practice, feedback, and accountability live in one experience.

The product combines a structured learning roadmap with the tools a learner needs between lessons:

- Course and module-based learning with embedded video
- Persistent completion state, last-accessed lessons, and learning streaks
- AI-powered PM skills quizzes, product teardowns, interview preparation, and open Q&A
- Direct messaging between learners and an instructor
- Comments and discussion on courses
- Curated PM templates and resources
- Calendly booking for 1:1 coaching
- Luma event discovery
- An admin workspace for managing course content, modules, settings, and resources

This is intentionally more than a static marketing page. It demonstrates how a product concept becomes a full-stack workflow with authenticated user journeys, relational data, content management, and third-party service boundaries.

## Product walkthrough

### Learner experience

1. A learner lands on the dashboard and sees the current learning roadmap.
2. They browse courses, open a module, and watch the lesson video.
3. Completing a module updates their progress and learning streak.
4. The dashboard surfaces courses in progress and recently accessed content.
5. The learner can switch from structured lessons to AI coaching, ask the instructor a question, book time, or find an upcoming event.

### Instructor experience

1. An admin signs in and opens the protected admin dashboard.
2. They create, edit, reorder, and delete courses.
3. They manage modules, durations, YouTube video IDs, thumbnails, and descriptions.
4. They configure homepage content, Calendly, Luma, and external PM resources.
5. They can review and resolve learner message threads.

## Portfolio highlights

This project demonstrates:

- Translating a learning-product concept into a focused mobile-first information architecture
- Designing a shared TypeScript contract between React, Express, Drizzle, and Zod
- Building REST endpoints with role-aware write operations
- Modeling progress, unlocks, streaks, conversations, comments, content, and settings in PostgreSQL
- Using TanStack Query for server-state fetching, caching, mutation, and invalidation
- Creating reusable accessible UI primitives with Radix UI and Tailwind CSS
- Integrating AI coaching and external scheduling/event services without coupling those providers to the UI
- Building an admin content workflow so the product can evolve without code changes for every lesson

## Technology

| Layer | Tools |
| --- | --- |
| Client | React 19, TypeScript, Vite, Wouter |
| UI | Tailwind CSS, shadcn/ui patterns, Radix UI, Lucide |
| State | TanStack React Query, Zustand |
| Server | Node.js, Express 5, TypeScript |
| Data | PostgreSQL, Drizzle ORM, Drizzle Zod |
| Content | YouTube embeds, external resource links |
| AI | OpenAI API / ChatKit integration points |
| Services | Calendly booking, Luma events |
| Delivery | Replit development workflow, Vite production build, esbuild server bundle |

## Repository map

```text
.
├── client/
│   └── src/
│       ├── components/        Shared layout, auth, and UI primitives
│       ├── hooks/             Reusable React hooks
│       ├── lib/               API client, query client, user context, utilities
│       ├── pages/             Learner, auth, messaging, events, and admin screens
│       ├── App.tsx            Client route map and providers
│       └── index.css          Design tokens and global styles
├── server/
│   ├── db.ts                 PostgreSQL connection
│   ├── index.ts              Express server bootstrap and middleware
│   ├── routes.ts             REST API endpoints and authorization checks
│   ├── seed.ts               Initial content seeding
│   ├── static.ts             Production static-file serving
│   ├── storage.ts            Database access layer
│   └── vite.ts               Development Vite integration
├── shared/
│   └── schema.ts             Drizzle tables, relations, Zod schemas, and types
├── script/
│   └── build.ts              Client and server production build
├── attached_assets/          Product imagery, brand assets, and content references
├── .env.example              Environment variable documentation
├── drizzle.config.ts         Drizzle migration configuration
├── replit.md                 Replit-specific project architecture notes
└── vite.config.ts            Vite and development plugin configuration
```

For a deeper explanation of request flow, data ownership, and extension points, see [`docs/architecture.md`](docs/architecture.md).

## Getting started

### Prerequisites

- Node.js 20+
- npm
- PostgreSQL

### Install

```bash
npm install
cp .env.example .env
```

Set `DATABASE_URL` to a PostgreSQL database before starting the server. The database schema can be applied with:

```bash
npm run db:push
```

### Run locally

```bash
npm run dev
```

The development server serves both the API and the Vite client on port `5000`.

### Validate and build

```bash
npm run check
npm run build
npm start
```

## Demo behavior and production notes

This repository is a portfolio/demo implementation, not a production-ready identity system. The current sign-in flow uses a fixed verification code (`1234`) and stores the user ID in `localStorage`; it is intentionally easy to evaluate but must be replaced before handling real accounts.

Before a production launch, the authentication boundary should be replaced with a real email/identity provider, server-managed sessions or signed tokens, CSRF protection, rate limiting, and secure role assignment. The AI and Luma features also require their respective secrets and should remain server-side.

The repository does not include credentials, database contents, generated build output, or `node_modules`.

## API surface

The Express API is grouped by product capability:

- `/api/auth/*` — send/verify demo code and resolve the current user
- `/api/courses/*` and `/api/modules/*` — learning content and admin authoring
- `/api/progress/*`, `/api/streak`, and `/api/unlocks/*` — learner state and roadmap access
- `/api/messages/*` and `/api/comments/*` — learner/instructor communication
- `/api/settings/*` and `/api/tools/*` — configurable homepage content and resources
- `/api/chat`, `/api/chatkit/session` — AI coaching entry points
- `/api/events` — upcoming Luma events

All write endpoints validate request data with Zod-derived schemas where appropriate and enforce admin access for content-management operations.

## Roadmap

The next product-minded improvements would be:

- Replace demo authentication with a provider-backed, server-validated session flow
- Add automated API and component tests around progress, permissions, and course editing
- Add a production-safe content migration and seed strategy
- Add observability for AI usage, external-service failures, and learner completion funnels
- Add richer learner analytics and instructor reporting
- Move large media assets to an object storage/CDN workflow

## License

MIT — see [`LICENSE`](LICENSE).