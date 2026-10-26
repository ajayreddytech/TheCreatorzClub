# The Creatorz Club

A responsive morning routine and habit tracker built with React, TypeScript, and Vite. Entries are stored locally by default, with optional Supabase authentication and cloud sync.

## Features

- Daily wake-up logs and editable routine checklist
- Calendar history and date-range insights
- Light and dark themes
- Optional Supabase sync with Google sign-in

## Tech stack

React, TypeScript, Vite, Supabase, Recharts, Framer Motion, and Lucide.

## Local development

Requirements: Node.js 22 or later and npm.

```sh
npm ci
npm run dev
```

To enable Supabase, copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Apply [`supabase/schema.sql`](./supabase/schema.sql) to your Supabase project. Never expose a service-role or secret key in this client-side app.

## Validation and production build

```sh
npm run lint
npm run build
npm run preview
```
