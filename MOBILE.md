# Rapid Math iPhone app

The app is built with Expo (React Native) and lives in the `mobile/` folder. You preview it
on your iPhone with **Expo Go**, and Expo's cloud service builds and submits it to the App
Store, so you don't need Xcode. The backend is your own Supabase project.

| Path | What it is |
| --- | --- |
| `mobile/` | The app: screens in `mobile/src/app`, logic in `mobile/src/lib` |
| `supabase/migrations/` | Full database schema and rules. Run once on a new project |
| `site/` | Landing page + privacy policy (Apple requires a privacy policy URL) |

## 1. Create your Supabase project (10 minutes, free)

1. Sign up at supabase.com and create a project. Pick the region closest to your users
   (for the UAE, Frankfurt or Mumbai).
2. **Create the database:** open **SQL Editor** and run these two files, in order
   (paste the whole file, then Run):
   1. `supabase/migrations/20261110000000_rapidmath_init.sql`
   2. `supabase/migrations/20261111000000_feedback.sql`
3. **Auth settings** (Authentication > Sign In / Providers > Email): turn **off**
   "Confirm email" for launch. The app handles it if you leave it on, but users then have to
   leave the app to click a link before they can sign in.
4. **Email code for "Forgot password"** (Authentication > Emails > Magic Link): make sure
   the template contains `{{ .Token }}`, e.g. `Your Rapid Math sign-in code is {{ .Token }}`.
5. **Keys:** Settings > API. Copy the Project URL and the publishable (anon) key into a file
   called `.env` inside the `mobile` folder (copy `mobile/.env.example`):
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   ```
   The publishable key is safe to ship in the app. Never put the `service_role` key in it.

## 2. Preview on your iPhone with Expo Go

1. Install **Expo Go** from the App Store on your iPhone.
2. On your Mac, install Node.js LTS from nodejs.org.
3. In Terminal:
   ```bash
   git clone https://github.com/promhd72/progress-pursue.git
   cd progress-pursue
   git checkout claude/rapidmath-site-access-sp7b0c
   cd mobile
   npm install
   npx expo start
   ```
4. A QR code appears in Terminal. Open the iPhone **Camera**, point it at the QR code and tap
   the banner. The app opens in Expo Go.

Your Mac and iPhone need to be on the same Wi-Fi. If the QR code doesn't connect (common on
office or hotel Wi-Fi), stop it with Ctrl+C and run `npx expo start --tunnel` instead.

Every time you save a change, the app on your phone reloads automatically.

## 3. Ship to the App Store (no Xcode needed)

1. **Apple Developer Program:** USD 99/year (about AED 365). Enroll as an organisation if you
   want the company name on the listing (needs a D-U-N-S number).
2. **Expo account:** sign up free at expo.dev, then in the `mobile` folder:
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest init
   ```
3. **Put your Supabase keys on Expo** so cloud builds can use them:
   ```bash
   npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_URL --value https://xxxx.supabase.co --environment production --visibility plaintext
   npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value YOUR_KEY --environment production --visibility plaintext
   ```
4. **Build and upload:**
   ```bash
   npx eas-cli@latest build --platform ios --profile production
   npx eas-cli@latest submit --platform ios
   ```
   The first build asks you to sign in with your Apple ID and creates the certificates for
   you. Submit uploads the build to App Store Connect, where it appears in TestFlight.
5. **Host the `site/` folder** anywhere free (GitHub Pages, Netlify drop, Cloudflare Pages)
   and replace `support@example.com` with your support email. Use `.../privacy.html` as the
   privacy policy URL and `.../index.html` as the support URL.
6. **App Store Connect:** screenshots (6.9" iPhone), description, privacy policy URL, support
   URL, App Privacy (email, name and app usage data; linked to the user; not used for
   tracking), and a **demo account** (email + password) in the review notes.

The Bundle ID is `app.rapidmath.ios` (in `mobile/app.json`). Change it before your first
build if you want a different one; it's permanent once the app is live.

## How the app works

Rapid Math has four parts, introduced by a 7-slide tour after sign-up (replay it from
Profile > How Rapid Math works):

- **Learn** (Learn tab): 27 mental-math techniques. Each explains when to use it, why it
  works, the method and worked examples, with a 3-question Try it that doesn't use a daily
  lesson.
- **Practise** (Train tab): 5 tracks × 10 levels. Every level is a named skill
  ("Crossing 10", "Carrying", "Add VAT") with a Learn card first, 10 questions built for
  that skill, and a time target. 8/10 passes; beating the target earns up to 3 stars.
  Train > Full curriculum shows the whole journey.
- **Coaching** (inside every lesson): Hint shows the first step; a wrong answer opens a
  step-by-step walkthrough for those exact numbers; results show how to solve each miss.
- **Apply** (Scenarios tab): 100 real-life scenarios (20 per topic) with charts and tables, priced in USD, across
  Everyday life, General business, Sales, Marketing and Finance.

**Onboarding:** Welcome > goal > daily goal > plan summary > create account > app tour >
reminder time > placement test > Train.

**Progress:** stars per level, XP raises your Rank (Starter → Mastermind), daily goal ring,
streak, local reminders that skip days you've trained.

**Free plan:** Levels 1 to 2 on all five tracks, 3 lessons and 3 scenarios per day.

**Feedback:** Profile > Help us improve > Request a feature / Send feedback. Messages land
in Supabase: **Table Editor > feedback** (with the sender's email, type and app version).

**Security:** the app can only read the user's own data. Lessons, placement, scenario
answers, XP, streaks, levels, Pro status and feedback are written only by the database
functions in the migrations, which enforce the rules.

**Account deletion:** Profile > Delete account removes the user and all their data (App
Store guideline 5.1.1(v)).

## Pro

Pro unlocks Levels 3 to 10 and removes the daily caps. There's no way to buy it yet; the app
says Pro is "launching soon". To give Pro to a tester, run in the SQL Editor:

```sql
update public.profiles set is_pro = true, pro_source = 'manual'
where email = 'tester@example.com';
```

When you're ready to sell it, add Apple In-App Purchase (RevenueCat has an Expo guide) and
have its webhook set `is_pro`. Apple takes 15% under the Small Business Program. In-app
coupon codes aren't offered because Apple's guideline 3.1.1 doesn't allow unlocking features
with your own codes.

## Known gaps

- Goal and daily target are saved on the device, not synced across devices.
- Reminders are local; server push (for campaigns) would need push notification setup.
- No "change password" screen yet; users can sign in with an email code instead.
