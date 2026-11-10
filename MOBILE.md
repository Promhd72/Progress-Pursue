# Rapid Math iPhone app

A standalone iPhone app. The screens are built into the app itself (React + Capacitor),
and the backend is your own Supabase project. Nothing depends on Lovable or a website.

| Path | What it is |
| --- | --- |
| `src/` | The app: screens, onboarding, keypad, reminders |
| `supabase/migrations/` | Full database schema and rules. Run once on a new project |
| `ios/` | The Xcode project |
| `site/` | Landing page + privacy policy (Apple requires a privacy policy URL) |
| `capacitor.config.ts` | App name, Bundle ID, splash and status bar settings |

## 1. Create your Supabase project (10 minutes, free)

1. Sign up at supabase.com and create a project. Pick the region closest to your
   users (for the UAE, Frankfurt or Mumbai).
2. **Create the database:** open **SQL Editor**, paste the whole of
   `supabase/migrations/20261110000000_rapidmath_init.sql`, and run it.
3. **Auth settings** (Authentication > Sign In / Providers > Email):
   - Turn **off** "Confirm email" for launch. The app handles it if you leave it on,
     but users then have to leave the app to click a link before they can sign in.
4. **Email code for "Forgot password"** (Authentication > Emails > Magic Link): make
   sure the template contains `{{ .Token }}` so users receive a 6-digit code, e.g.
   `Your Rapid Math sign-in code is {{ .Token }}`.
5. **Keys:** Settings > API. Copy the Project URL and the publishable (anon) key into a
   file called `.env` in the project folder (see `.env.example`):
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=...
   ```
   The publishable key is safe to ship in the app. Never put the `service_role` key in
   the app.

## 2. Run it on your Mac

You need Xcode (Mac App Store) and Node.js 20+ (nodejs.org).

```bash
npm install
npm run dev          # optional: try it in a browser at http://127.0.0.1:5173
npm run ios:sync     # builds the app and copies it into Xcode
npm run ios:open     # opens Xcode
```

In Xcode: select the **App** target > **Signing & Capabilities** > pick your Team, choose
an iPhone simulator (or plug in your iPhone) and press Run.

Live reload while you work: run `npm run dev` in one Terminal and `npm run ios:dev` in
another; the simulator then loads from your Mac and updates as you edit. Run
`npm run ios:sync` again before building for TestFlight.

Bundle ID is `app.rapidmath.ios`. If you want a different one, change it in
`capacitor.config.ts` and in Xcode before your first upload. It's permanent once live.

## 3. Ship to the App Store

1. Apple Developer Program: USD 99/year (about AED 365). Enroll as an organisation if
   you want the company name on the listing (needs a D-U-N-S number).
2. Host the `site/` folder anywhere free (GitHub Pages, Netlify drop, Cloudflare Pages)
   and replace `support@example.com` with your support email. You'll use
   `.../privacy.html` as the privacy policy URL and `.../index.html` as the support URL.
3. App Store Connect: create the app with the same Bundle ID. Fill in screenshots
   (6.9" iPhone), description, privacy policy URL, support URL, and App Privacy
   (email, name, and app usage data; linked to the user; not used for tracking).
4. Xcode: **Product > Archive > Distribute App > App Store Connect**, then test via
   TestFlight.
5. In the review notes, give Apple a **demo account** (email + password).

## How it works

**Onboarding:** Welcome > goal > daily goal (1 to 3 lessons, all doable on Free) > plan
summary > create account > reminder time > 2-minute placement test > Train tab.

**Daily loop:** goal ring + "Start today's lesson" on the Train tab, full-screen lessons
with an on-screen keypad, haptics, results with a share button, streak in the title bar,
local reminders that skip days you've trained.

**Free plan:** Levels 1 to 2 on all five tracks, 3 lessons and 3 Advanced scenarios per day.

**Security:** the app can only read the user's own data. Lessons, placement, Advanced
answers, XP, streaks, levels and Pro status are written only by the database functions
in the migration, which enforce the daily limits, Pro-only levels and level progression.

**Account deletion:** Profile > Delete account removes the user and all their data
(App Store guideline 5.1.1(v)).

## Pro

Pro unlocks Levels 3 to 10 and removes the daily caps. There's no way to buy it yet; the
app says Pro is "launching soon". To give Pro to a tester, run in the SQL Editor:

```sql
update public.profiles set is_pro = true, pro_source = 'manual'
where email = 'tester@example.com';
```

When you're ready to sell it, add Apple In-App Purchase (RevenueCat makes this simpler)
and have its webhook set `is_pro`. Apple takes 15% under the Small Business Program.
In-app coupon codes aren't offered because Apple's guideline 3.1.1 doesn't allow
unlocking features with your own codes; the `redeem_coupon` database function is kept
in case you add a web sign-up later.

## Known gaps

- Goal and daily target are saved on the device, not synced across devices.
- Reminders are local; server push (for campaigns) would need APNs setup.
- No "change password" screen yet; users can sign in with an email code instead.
