# Rapid Math

iPhone app for daily mental math training.

- **The app lives in `mobile/`** (Expo / React Native, Expo Router). See `mobile/AGENTS.md`.
- Backend is Supabase. Database schema and rules: `supabase/migrations/`. Scores, XP, streaks and Pro are
  only written through the SQL functions there; the app has read-only table access.
- `site/` is the landing page + privacy policy.
- Setup and release steps: `MOBILE.md`.
- The repo root still holds the earlier Capacitor/web version (`src/`, `ios/`, `vite.config.ts`). It is
  superseded by `mobile/` and will be removed once the Expo app is confirmed on a device.
