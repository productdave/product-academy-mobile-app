# Architecture notes

This document is a map for anyone reviewing, extending, or interviewing against Product Academy.

## System shape

```text
React pages/components
        │
        │ same-origin JSON requests
        ▼
Express routes (/api/*)
        │
        │ validated input + user/role checks
        ▼
DatabaseStorage
        │
        ▼
PostgreSQL via Drizzle ORM

External boundaries:
  OpenAI  ← server-side AI routes
  YouTube ← client-side embedded lesson playback
  Calendly ← client booking embed
  Luma    ← server-side event retrieval
```

The server and client are deployed together. In development, Express mounts Vite middleware. In production, the build script emits the client to `dist/public` and bundles the server to `dist/index.cjs`.

## Request and state flow

1. A page calls a small capability-focused client in `client/src/lib/api.ts`.
2. The API client adds the current user ID header when the user is signed in.
3. Express routes in `server/routes.ts` perform authentication checks, parse request bodies, and call the storage interface.
4. `DatabaseStorage` in `server/storage.ts` owns Drizzle queries and keeps persistence details out of route handlers.
5. The route returns a small JSON envelope.
6. TanStack Query caches the result and invalidates related data after mutations.

This separation makes the main product flows readable: page components describe the user experience, the API client describes the network contract, routes describe authorization/orchestration, and storage describes persistence.

## Domain model

The schema in `shared/schema.ts` is the source of truth for both database tables and TypeScript/Zod types.

| Domain | Tables | Purpose |
| --- | --- | --- |
| Identity | `users` | Student/admin roles, profile, and learning streak counters |
| Curriculum | `courses`, `modules` | Roadmap stages and ordered video lessons |
| Progress | `user_progress`, `user_unlocks` | Completion state, last access, streak support, and gated courses |
| Community | `messages`, `comments` | Instructor conversations and course discussion |
| Configuration | `settings`, `tools` | Editable homepage content, integrations, and PM resources |

Foreign keys use cascade behavior where child records should not outlive a deleted user, course, or module. Course reordering is performed in a transaction so roadmap stage updates remain consistent.

## Frontend map

- `client/src/App.tsx` is the route registry.
- `client/src/pages/home.tsx` is the dashboard and combines courses, progress, tools, AI flows, and events.
- `client/src/pages/courses.tsx`, `course.tsx`, and `lesson.tsx` form the learning journey.
- `client/src/pages/chat.tsx` contains the AI coaching entry experience.
- `client/src/pages/messages.tsx` and `message-detail.tsx` model instructor communication.
- `client/src/pages/admin/dashboard.tsx` is the role-protected content and configuration workspace.
- `client/src/components/layout.tsx` provides shared navigation and page framing.
- `client/src/components/ui/` contains reusable Radix/shadcn-style primitives.
- `client/src/lib/user-context.tsx` owns client-side identity state.
- `client/src/lib/queryClient.ts` configures the shared TanStack Query client.

## Backend map

- `server/index.ts` creates Express, installs JSON parsing and API logging, registers routes, seeds an empty database, and chooses Vite vs static serving.
- `server/routes.ts` is organized by capability and is the best place to understand the API contract.
- `server/storage.ts` implements `IStorage`, keeping database operations testable and centralized.
- `server/db.ts` creates the PostgreSQL pool.
- `server/seed.ts` provides initial curriculum data.
- `server/static.ts` serves the production client bundle.

## Authorization boundary

The current demo uses an `x-user-id` header populated from `localStorage`. Routes resolve that ID against PostgreSQL. Admin mutations then check the resolved user's role before allowing course, module, settings, or tool changes.

This is useful for demonstrating the product workflow, but it is not an acceptable production authentication design. A production version should establish identity on the server, avoid trusting browser-provided identity headers, and derive the admin role from a protected source of truth.

## Extension guide

### Add a new learner capability

1. Add or extend a table and relation in `shared/schema.ts`.
2. Add storage methods to `IStorage` and implement them in `DatabaseStorage`.
3. Add a route in the matching capability section of `server/routes.ts`.
4. Add a typed method to `client/src/lib/api.ts`.
5. Add a page or component and wire its query/mutation invalidation.

### Add editable admin content

Use the existing `settings` or `tools` patterns when the content is simple and configurable. Use a dedicated table when it needs relationships, ordering, permissions, or analytics.

### Add an external service

Keep credentials and provider-specific calls on the server. Return a product-shaped response to the client so the UI does not become coupled to provider payloads or secret handling.

## Repository hygiene

Generated output (`dist`), dependencies (`node_modules`), local environment files, and OS metadata are ignored. Secrets belong in the environment manager, never in source files or documentation. The attached assets are retained because they are part of the current product prototype; a future cleanup could rename or migrate them to a dedicated media pipeline.