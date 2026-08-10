# KAIVO Website

KAIVO’s public website and multi-tenant brand operating platform.

## Foundation

- React 19, Vite 8 and TypeScript
- Tailwind CSS, Lucide React and Framer Motion
- Supabase Auth, Database, Storage and Edge Functions
- Database-enforced organization isolation through RLS

## Start locally

```bash
npm install
npm run dev
```

The local address is normally `http://localhost:5173`.

Protected routes require `.env.local` configuration for the dedicated KAIVO
Supabase project. Follow [the Supabase setup guide](docs/KAIVO_SUPABASE_SETUP.md)
before testing administrator or business access.

## Quality checks

```bash
npm run lint
npm run build
```

## Project structure

```text
src/
  assets/brand/        Official KAIVO brand pack
  auth/                Session and verified tenant resolution
  components/intro/    Cinematic entry animation
  production/          Admin and business workspaces
  lib/                 Supabase and service boundaries
  types/               Shared application/database types
supabase/
  migrations/          Versioned schema and RLS policies
  functions/           Secure provisioning/access functions
docs/                  Setup and tenant-isolation procedures
```

## Phase 1 routes

- Public: `/`, `/login`, `/forgot-password`, `/reset-password`
- Admin: `/admin/login`, `/admin`, `/admin/businesses`, `/admin/users`,
  `/admin/activity`, `/admin/settings`
- Business: `/dashboard`, `/dashboard/content`, `/dashboard/create`,
  `/dashboard/calendar`, `/dashboard/socials`, `/dashboard/brand`,
  `/dashboard/assets`, `/dashboard/team`, `/dashboard/tasks`,
  `/dashboard/activity`, `/dashboard/settings`

No production deployment is performed automatically.
