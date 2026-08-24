# Product Academy

## Overview

Product Academy is a mobile-first learning management system (LMS) designed to help users break into Product Management careers. The platform offers courses, AI-powered coaching, direct messaging with instructors, and Calendly booking integration. Built as a full-stack TypeScript application with React frontend and Express backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, Zustand for client state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Build Tool**: Vite with custom plugins for Replit deployment

The frontend follows a page-based structure in `client/src/pages/` with shared components in `client/src/components/`. The UI uses Radix UI primitives wrapped by shadcn/ui for consistent, accessible components.

### Backend Architecture
- **Framework**: Express 5 on Node.js
- **Database ORM**: Drizzle ORM with PostgreSQL
- **API Style**: RESTful JSON API under `/api/*` routes
- **Session**: PostgreSQL-backed sessions via connect-pg-simple

The server code lives in `server/` with the main entry point at `server/index.ts`. Routes are registered in `server/routes.ts` and database operations are abstracted through `server/storage.ts`.

### Database Schema
Located in `shared/schema.ts`, the schema includes:
- **users**: User accounts with email-based auth and admin/student roles
- **courses**: Course content with stages for learning roadmap
- **modules**: Video lessons within courses (YouTube video IDs)
- **userProgress**: Tracks which modules users have completed
- **messages**: Direct messaging between users and admin
- **comments**: Discussion comments on courses
- **settings**: Application configuration

### Authentication
- Email-based magic code authentication (demo code: 1234)
- User ID stored in localStorage and sent via `x-user-id` header
- Admin detection based on specific email address

### Key Features
1. **Course System**: Courses contain modules with video content, organized by "stages" on a learning roadmap
2. **AI Test**: PM skill assessment tool powered by OpenAI Agents
3. **Direct Messaging**: Private conversations between students and admin
4. **Calendly Integration**: Embedded booking widget for 1:1 sessions
5. **Progress Tracking**: Module completion state per user

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migrations stored in `migrations/` directory

### Third-Party Services
- **Calendly**: Embedded booking widget (react-calendly package)
- **YouTube**: Video content hosting (embedded via react-player)

### Key NPM Packages
- **@tanstack/react-query**: Server state management
- **drizzle-orm / drizzle-zod**: Database ORM with Zod schema validation
- **react-player**: Video playback component
- **zustand**: Lightweight client state management
- **wouter**: Minimal React router
- **shadcn/ui components**: Full Radix UI component library

### Deployment
- Vite builds to `dist/public` for static assets
- Server builds via esbuild to `dist/index.cjs`
- Custom Vite plugins for Replit-specific features (dev banner, meta images)