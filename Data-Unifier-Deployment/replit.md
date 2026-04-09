# CareDeploy — Edge Deployment Manager

A CareFlow Systems deployment dashboard for transitioning Replit prototype apps to self-hosted Linux edge servers with a unified PostgreSQL database strategy.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS v4 + shadcn/ui components
- **Backend**: Express.js with REST API routes
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: wouter (frontend), Express (backend)

## Data Model

- **Edge Nodes**: Linux servers in the fleet (hostname, IP, location, resource usage, status)
- **Applications**: Apps to deploy (name, repo, port, env vars, status)
- **Deployments**: Deployment records linking apps to nodes (version, status, logs)
- **Database Configs**: Centralized PostgreSQL connection configurations (host, pool size, schema prefix)
- **Schema Mappings**: Field-level translation rules from each app's original DB schema to the unified central DB (versioned per app)

## Key Files

- `shared/schema.ts` — Drizzle schema & Zod validation
- `server/db.ts` — Database connection pool
- `server/storage.ts` — CRUD storage interface (DatabaseStorage)
- `server/routes.ts` — REST API routes (/api/*)
- `client/src/components/layout.tsx` — Sidebar + layout shell
- `client/src/lib/api.ts` — Typed API client
- `client/src/pages/` — Dashboard, Nodes, Applications, Deployments, Databases, Schema Mappings

## API Routes

All prefixed with `/api`:
- `GET/POST /nodes`, `GET/PATCH/DELETE /nodes/:id`
- `GET/POST /apps`, `GET/PATCH/DELETE /apps/:id`
- `GET/POST /deployments`, `PATCH /deployments/:id`
- `GET /deployments/app/:appId`, `GET /deployments/node/:nodeId`
- `GET/POST /databases`, `GET/PATCH/DELETE /databases/:id`
- `GET /stats` — Dashboard aggregate stats
- `GET /mappings`, `POST /mappings`, `POST /mappings/bulk`, `POST /mappings/copy`
- `GET /mappings/app/:appId`, `GET /mappings/app/:appId/version/:version`
- `PATCH /mappings/:id`, `DELETE /mappings/:id`, `DELETE /mappings/app/:appId/version/:version`

## Design System

- CareFlow Systems branding with `@/stylesheet` module (Logo, ThemeProvider, UserMenu, CopyRight, LanguageSelector)
- Dark "mission control" aesthetic with DM Sans (display/body), Fira Code (mono), AA Stetica Medium (brand)
- CareFlow blue primary (#2e5cbf), secondary (#008ed3)
- Terminal-inspired status colors: green (online), amber (degraded), red (failed), cyan (info)
- Consistent card-based layout with subtle animations

## Stylesheet Module (`client/src/stylesheet/`)

Shared CareFlow branding components importable via `@/stylesheet`:
- `CareFlowLogo` — Logo image component with size variants
- `ThemeProvider` / `useTheme` — Light/dark theme context
- `LanguageSelector` / `useLanguage` — Multi-language selector (DE, EN, FR, ES, IT)
- `UserMenu` — User avatar, logout, theme toggle
- `CopyRight` — Copyright footer with version
- `colors`, `gradients`, `careflowStyles` — Design tokens
