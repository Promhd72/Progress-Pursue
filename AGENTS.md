# Rapid Math

iPhone app for daily mental math training. React + TanStack Router, built with Vite
into `dist/` and packaged with Capacitor (`ios/`). Backend is Supabase.

- `npm run dev`: run the app in a browser at http://127.0.0.1:5173
- `npm run build`: build `dist/`
- `npm run ios:sync`: build and copy into the Xcode project
- Database schema and rules: `supabase/migrations/`. Scores, XP, streaks and Pro are only
  written through the SQL functions there; the app has read-only table access.
- Setup and release steps: `MOBILE.md`
