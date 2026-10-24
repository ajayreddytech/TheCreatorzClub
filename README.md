# The Creatorz Club

The Creatorz Club is a responsive morning habit tracker built with React, TypeScript, and Vite.

## Get started

```sh
npm install
npm run dev
```

Without a backend, logs, routine tasks, and checklist progress are saved in the current browser.

## Configure Supabase and Google sign-in

1. **Create the Supabase project.** Sign up at [supabase.com](https://supabase.com), create a project, and save its database password somewhere secure.
2. **Create the app tables and security policies.** In the Supabase dashboard, open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](./supabase/schema.sql), and run it. The schema creates the profiles, daily logs, routine checklist tables, and row-level security (RLS) policies.
3. **Copy the app API settings.** In **Project Settings → API**, copy the Project URL and the publishable/anon key. Create a `.env` file beside `package.json` based on [`.env.example`](./.env.example), and fill in:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
   ```

   Do not use a `service_role` or secret key in this frontend app. The anon/publishable key is intended for browser use when RLS is enabled.

4. **Create Google OAuth credentials.** In the [Google Cloud Console](https://console.cloud.google.com/), select or create a project, configure the OAuth consent screen, then create an **OAuth client ID** with application type **Web application**. Set the authorized redirect URI to:

   ```text
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```

   Replace `YOUR_PROJECT_REF` with the reference in your Supabase project URL. Also add your app origins (for local testing, `http://localhost:5173`; for production, your deployed domain) under **Authorized JavaScript origins**. Copy the Google client ID and client secret.
5. **Enable Google in Supabase.** In Supabase, open **Authentication → Providers → Google**, turn it on, paste the Google client ID and client secret, and save.
6. **Allow your app's callback URLs.** In **Authentication → URL Configuration**, set the Site URL to your deployed app URL (for local development, `http://localhost:5173`). Add these Redirect URLs:

   ```text
   http://localhost:5173/**
   http://127.0.0.1:5173/**
   https://YOUR_DEPLOYED_DOMAIN/**
   ```

   Replace the last URL with your actual production domain. Also add that domain to the Google OAuth client's authorized JavaScript origins when deploying.
7. **Restart the app.** Stop and restart `npm run dev` so Vite reads `.env`. Open **Settings → Continue with Google**. After Google sign-in, daily logs and checklist changes are stored under the authenticated account and protected by RLS.

Each Supabase project has its own database and Google OAuth settings. Existing browser-only data is not automatically uploaded when you first sign in; retain your current browser data until you confirm the account is set up.

## Production build

```sh
npm run build
npm run preview
```

## Deploy to Netlify

The site is configured in [`netlify.toml`](./netlify.toml) to build with `npm run build`, publish `dist`, and route client-side URLs back to the app. Connect the GitHub repository to Netlify and use:

- **Production URL:** <https://thecreatorzclub.netlify.app/>
- **Build command:** `npm run build`
- **Publish directory:** `dist`

In Netlify's site settings, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as production environment variables (and for deploy previews only if you intend to test cloud sync there). Trigger a new deploy after changing environment variables. Never add a Supabase service-role or secret key to Netlify's frontend build environment.

For production Google sign-in, add `https://thecreatorzclub.netlify.app` to the Google OAuth client's **Authorized JavaScript origins**. In Supabase **Authentication → URL Configuration**, set the Site URL to `https://thecreatorzclub.netlify.app` and add `https://thecreatorzclub.netlify.app/**` to the allowed Redirect URLs. Keep the local redirect URLs from the setup steps for development. If OAuth is needed on Netlify deploy previews, add only the preview URL pattern you intend to use to Supabase's allowed redirects and Google's authorized origins.

## GitHub checks

The workflow in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs `npm ci`, lint, and a production build for pushes and pull requests. Keep `.env` files private; `.env.example` is the safe template to commit.
