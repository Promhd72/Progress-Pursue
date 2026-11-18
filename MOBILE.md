# Rapid Math iPhone app

The app is built with Expo (React Native) and lives in the `mobile/` folder. You preview it
on your iPhone with **Expo Go**, and Expo's cloud service builds and submits it to the App
Store, so you don't need Xcode. The backend is your own Supabase project.

| Path | What it is |
| --- | --- |
| `mobile/` | The app: screens in `mobile/src/app`, logic in `mobile/src/lib` |
| `supabase/migrations/` | Full database schema and rules. Run once on a new project |
| `site/` | Landing page, privacy policy and terms (Apple requires a privacy policy URL) |

## 1. Create your Supabase project (10 minutes, free)

1. Sign up at supabase.com and create a project. Pick the region closest to your users
   (for the UAE, Frankfurt or Mumbai).
2. **Create the database:** open **SQL Editor** and run these two files, in order
   (paste the whole file, then Run):
   1. `supabase/migrations/20261110000000_rapidmath_init.sql`
   2. `supabase/migrations/20261111000000_feedback.sql`
   3. `supabase/migrations/20261112000000_pro_subscriptions.sql`
   4. `supabase/migrations/20261113000000_delete_account_feedback.sql`
   5. `supabase/migrations/20261114000000_free_levels_by_placement.sql`
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
   and replace `support@example.com` with your support email (it appears in `index.html`,
   `privacy.html` and `terms.html`). Use `.../privacy.html` as the privacy policy URL and
   `.../index.html` as the support URL.
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

**Free plan:** Levels 1 and 2 on every skill, or up to Level 4 on skills where the placement
test puts you higher (placed at Level 3: Levels 1–3 free; placed at 4 or 5: Levels 1–4 free).
Passing levels doesn't raise the free limit, only placement does, and a retake never lowers it.
Also 3 lessons and 3 scenarios per day. The Meeting
warm-up is free and unlimited.

**Feedback:** Profile > Help us improve > Request a feature / Send feedback. Messages land
in Supabase: **Table Editor > feedback** (with the sender's email, type and app version).

**Security:** the app can only read the user's own data. Lessons, placement, scenario
answers, XP, streaks, levels, Pro status and feedback are written only by the database
functions in the migrations, which enforce the rules.

**Account deletion:** Profile > Delete account removes the user and all their data (App
Store guideline 5.1.1(v)).

## Pro (App Store subscriptions)

Pro unlocks Levels 5 to 10 and removes the daily caps on lessons and scenarios.

| Plan | Price (USD) |
| --- | --- |
| Monthly | $4.99 |
| Yearly | $29.99 (about $2.50/month) |

Apple converts these to local prices (AED in the UAE). The app always shows the store's real
price. There is no free trial: the free levels are the taster. Free users see "Upgrade to Pro" when they reach the end of their free levels, run out of daily lessons
or scenarios, place above Level 4, and in Profile > Rapid Math Pro.

**How it works:** the app buys through Apple using RevenueCat. Right after a purchase it asks the
`revenuecat` Edge Function to check the subscription with RevenueCat, and only that function can
set `is_pro` (through the server-only `set_store_pro` database function). RevenueCat's webhook
calls the same function for renewals, cancellations and expiry. The app can't unlock Pro by itself.

Purchases only work in a real build (TestFlight or the App Store). In Expo Go and the web preview
the Pro screen works but no payment is taken, and in demo mode a "purchase" just unlocks Pro on
that device.

### Set it up (about an hour, once)

1. **Paid apps agreement:** App Store Connect > Business. Accept the Paid Apps agreement and add
   your bank and tax details. Subscriptions don't work until this is active.
2. **Create the subscriptions:** App Store Connect > your app > Subscriptions.
   - Create a subscription group called `Rapid Math Pro`.
   - Add two subscriptions: `rapidmath_pro_monthly` (1 month, USD 4.99) and
     `rapidmath_pro_yearly` (1 year, USD 29.99). Give each a display name and description.
   - Don't add an Introductory Offer (no free trial). If one is ever added, the app ignores it.
3. **RevenueCat** (free until USD 2,500/month revenue): sign up at revenuecat.com, create a
   project, add an **App Store** app with Bundle ID `app.rapidmath.ios`, and follow its steps to
   connect App Store Connect (In-App Purchase key).
   - **Products:** import both subscriptions.
   - **Entitlements:** create one called exactly `pro` and attach both products.
   - **Offerings:** in the `default` offering, add a **Monthly** package
     (`rapidmath_pro_monthly`) and an **Annual** package (`rapidmath_pro_yearly`).
4. **Edge Function** (Supabase dashboard > Edge Functions > Deploy a new function > Via editor):
   name it `revenuecat`, paste `supabase/functions/revenuecat/index.ts`, deploy. Then open the
   function's settings and turn **off** "Enforce JWT verification" (it checks its own keys).
5. **Secrets** (Supabase > Edge Functions > Secrets):
   - `REVENUECAT_SECRET_KEY`: RevenueCat > Project settings > API keys > create a **secret** key.
   - `REVENUECAT_WEBHOOK_AUTH`: make up a long random password.
6. **Webhook:** RevenueCat > Integrations > Webhooks > add one.
   - URL: `https://YOUR-PROJECT-REF.supabase.co/functions/v1/revenuecat`
   - Authorization header value: `Bearer ` followed by your `REVENUECAT_WEBHOOK_AUTH` password.
7. **App keys:** add these to `mobile/.env` and to EAS (same way as the Supabase keys):
   ```
   EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...   (RevenueCat > API keys > Apple public key)
   EXPO_PUBLIC_SUPPORT_EMAIL=you@yourdomain.com
   ```
   The support email appears in the in-app Privacy Policy, Terms and Profile > Contact support.
8. **Test in TestFlight** with a Sandbox tester (App Store Connect > Users and Access > Sandbox).
   Sandbox time runs fast: a monthly subscription renews every 5 minutes, so you can watch it renew.

**For App Review:** submit the subscriptions together with the build (they're reviewed with it),
and mention in the review notes where Pro is (see "App Store review checklist" below). The Pro
screen already shows the price, billing period, auto-renew terms, Restore, Terms of Use and
Privacy Policy, which Apple requires.

To give Pro to a tester without paying, run in the SQL Editor:

```sql
update public.profiles set is_pro = true, pro_source = 'manual'
where email = 'tester@example.com';
```

Apple takes 15% under the Small Business Program (apply in App Store Connect). In-app coupon
codes aren't offered because Apple's guideline 3.1.1 doesn't allow unlocking features with your
own codes; use Apple's Offer Codes instead.

## Languages (English and Bahasa Indonesia)

- The app follows the iPhone language on first launch (Indonesian phones open in Bahasa
  Indonesia). People can switch any time: the EN | ID toggle on the welcome screen, or
  Profile > Language. iOS also lists both languages in Settings > Rapid Math > Language.
- English text in the code is the source. Indonesian lives in `mobile/src/lib/i18n/id.json`
  (English sentence → Indonesian). Text components translate themselves; numbers inside a
  sentence are matched automatically, so "3 of 10 correct" and "7 of 10 correct" share one entry.
- Anything without a translation shows in English, so a missing line never breaks the app.
- Prices stay in US dollars inside scenarios and warm-ups. Real subscription prices come from
  the App Store, so Indonesian users see rupiah on the Pro screen.
- When you add or change English text, add the Indonesian line to `id.json` too.

**App Store listing in Indonesian** (App Store Connect > your app > add localization
"Indonesian"):

- Name: Rapid Math: Hitung Cepat
- Subtitle: Latihan hitung di kepala
- Promotional text: Lebih cepat dan percaya diri dengan angka, di rapat maupun di perjalanan. Lima menit sehari.
- Keywords: hitung cepat,matematika,berhitung,persen,diskon,otak,latihan,kerja,rapat,angka
- Description: Rapid Math melatihmu menghitung di kepala dengan cepat: persentase, diskon,
  membagi tagihan, pertumbuhan, dan margin. Pelajari triknya, latih sampai otomatis, dan pakai
  di soal kerja nyata. Pelajaran 2 menit, streak harian, pemanasan 60 detik sebelum rapat, dan
  100 skenario dunia nyata. Level awal gratis. Rapid Math Pro membuka semua level dan latihan
  tanpa batas.

## App Store review checklist

What's already built in, so you don't have to worry about it:

| Apple rule | How the app meets it |
| --- | --- |
| 5.1.1 Privacy policy | Privacy Policy and Terms open inside the app: on sign-up, on the Pro screen and in Profile. Text lives in `mobile/src/lib/legal.ts`; `site/privacy.html` and `site/terms.html` mirror it |
| 5.1.1(v) Account deletion | Profile > Delete account removes the account and all data at once, including feedback messages |
| 3.1.1 In-app purchase | Pro is only sold through the App Store. No codes, no outside payment links |
| 3.1.2 Subscriptions | Pro screen shows the plan name, length, billed price (the largest price on the card), auto-renew terms, Restore purchases, Terms and Privacy |
| 4.5.4 / 5.1.1 Notifications | Reminders are optional and only asked for when the user turns them on |
| Privacy manifest | Declared in `mobile/app.json` (`ios.privacyManifests`): no tracking |
| Export compliance | `usesNonExemptEncryption: false`, so no encryption paperwork |
| 2.1 App completeness | A build without Supabase keys runs in demo mode and shows a "Demo mode" notice. **Never submit that build**: check step 3 of "Ship to the App Store" is done first |

What you fill in on App Store Connect:

1. **Demo account.** Create a normal account in the app (for example `review@yourdomain.com`) and
   put the email and password in App Review Information > Sign-in required. In Supabase >
   Authentication > Sign In / Providers > Email, turn off "Confirm email" (or confirm that one
   account by hand) so the reviewer can sign in straight away.
2. **Review notes.** Suggested text: "Rapid Math is a mental maths trainer. Sign in with the demo
   account. Lessons are on the Train tab. Rapid Math Pro (auto-renewing
   subscription) opens from the 'Try Pro' button on the Train tab or from Profile. Account deletion is
   at Profile > Delete account."
3. **App Privacy answers.** Data collected: Email Address, Name, Product Interaction (training
   results), Purchases, Customer Support (feedback messages). All linked to the user, used for
   App Functionality only. Tracking: No.
4. **Age rating.** Answer "None" to every content question. Result: 4+. Don't choose the Kids
   category.
5. **Category.** Education (primary), Productivity (secondary).
6. **Subscriptions.** Attach both subscriptions to the version before you submit, each with a
   review screenshot of the Pro screen. Add the Terms link (Apple's standard EULA is fine) in
   the App Description or the EULA field.
7. **Screenshots.** Ready to upload in `store-screenshots/`: 7 for English (`en-*.png`) and 7
   for the Indonesian listing (`id-*.png`), 1320 × 2868 (the 6.9" iPhone size; Apple scales them
   for smaller iPhones). Upload them in numbered order.
8. **Name.** "Rapid Math" may be taken on the App Store. Have a backup such as
   "Rapid Math: Mental Maths".

Common reasons for a first rejection, and what to check:

- The reviewer can't sign in (demo account wrong, or email confirmation still on).
- Subscriptions weren't submitted with the build, so the Pro screen shows an error.
- The privacy policy URL in App Store Connect doesn't load.
- Screenshots don't match the app.

## Known gaps

- Goal and daily target are saved on the device, not synced across devices.
- Reminders are local; server push (for campaigns) would need push notification setup.
- No "change password" screen yet; users can sign in with an email code instead.

## Meeting warm-up and confidence check-in

- **Meeting warm-up** (Train tab): 60 seconds of questions phrased the way numbers come up at work and
  in conversation ("We're at 20% of our $300K target..."). Wrong answers show the sum behind the
  question, and the results screen has the step-by-step method for each one. Practice only: the best
  score is kept on the device and doesn't add XP.
- **Confidence check-in**: onboarding asks how confident you feel with numbers (1 to 5). After 14 days
  a card on the Train tab asks again, and Profile shows the before and after. Kept on the device.

## Badges and research

- **Badges** (Profile > Badges): 40 badges for passing skill milestones (Levels 2, 5, 8, 10 on each
  skill), stars, ranks, streaks, Meeting warm-ups, scenarios and techniques. A celebration pops up the moment one is
  earned. They're computed on the device from data the app already has, so no database change.
- **Why Rapid Math works** (Learn tab, or Profile > The research behind it): why these five skills,
  how the method works, and nine peer-reviewed sources.
