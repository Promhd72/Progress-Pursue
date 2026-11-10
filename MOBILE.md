# Rapid Math iPhone app

The iPhone app is a native shell (Capacitor) around the live Lovable site.
When you publish in Lovable, the app updates on its own. You only resubmit to
the App Store when something native changes (icon, name, plugins, iOS settings).

## What's in this repo

| Path | What it is |
| --- | --- |
| `capacitor.config.ts` | App name, Bundle ID, the URL the app loads, splash and status bar settings |
| `ios/` | The Xcode project. Open this on a Mac to build |
| `mobile/www/` | Fallback pages bundled in the app (loading + "You're offline") |
| `src/lib/native.tsx` | Helpers that only activate inside the app: haptics, status bar, `WebOnly` |

## How the app differs from the website

Everything below only switches on inside the iOS app (`src/lib/native.tsx` detects it).
The website is unchanged apart from account deletion and the logo fix.

**Feels like an app, not a website** (App Store guideline 4.2)
- Bottom tab bar (Train, Advanced, History, Profile) and an iOS-style title bar with
  your streak, replacing the web header.
- Lessons and the placement test are full-screen with a close button and a custom
  number keypad. The iPhone's number keyboard has no return key, so answers could not
  be submitted before.
- Haptics on keypad taps, right/wrong answers, tab switches and finishing a lesson.
- No pinch zoom, no input zoom, no text selection or link previews, no rubber-band
  bounce. Splash screen stays up until the first screen has rendered.
- Offline banner, plus a native offline screen if the app can't load at all.
- Share sheet for lesson results.
- Coming back to the app refreshes streak and stats.

**Onboarding** (signed-out users never see the marketing site)
1. Welcome: value proposition.
2. Goal: meetings, interviews, everyday money maths (VAT, discounts) or brain training.
3. Daily goal: 3, 5 or 10 minutes (1 to 3 lessons, all achievable on Free).
4. "Your plan is ready" summary, then account creation.
5. Reminder time (morning, lunch, evening) and the iOS notification prompt.
6. 2-minute placement test, then the dashboard.

Existing users opening the app for the first time get steps 5 and 6 only (placement is
skipped if they already did it).

**Retention hooks**
- Daily goal ring on the Train tab with a one-tap "Start today's lesson".
- Local streak reminders, skipped on days the user already trained. Time and daily goal
  are editable in Profile.

**App Store compliance**
- Purchase UI, pricing and "$10/mo" copy hidden (guideline 3.1.1). Existing Pro users
  keep Pro.
- Google sign-in hidden (Google blocks it in embedded web views; offering it would also
  require Sign in with Apple, guideline 4.8).
- Account deletion in Profile (guideline 5.1.1(v)). Cancels any active Paddle
  subscription first. Applies on the website too.

Goal and daily target are stored on the device, not in Supabase, so they don't sync
across devices yet.

## Step 1: get the web changes live

The app loads `https://rapidmath.lovable.app`, so the `src/` changes above have to be
published from Lovable before they show up in the app:

1. In Lovable, connect the project to this GitHub repo (or copy the changed files in).
2. Publish.

## Step 2: build on a Mac

You need a Mac with Xcode (free from the Mac App Store), plus Node 20+.

```bash
npm install
npm run ios:sync     # copies config + plugins into the Xcode project
npm run ios:open     # opens Xcode
```

In Xcode:

1. Select the **App** target > **Signing & Capabilities** > pick your Team.
2. If `app.rapidmath.ios` is taken, change the Bundle ID here **and** in
   `capacitor.config.ts`, then run `npm run ios:sync` again.
3. Plug in your iPhone (or pick a simulator) and press Run.

No Mac? Cloud build services like Codemagic or Ionic Appflow can build and upload
this project for you.

## Step 3: ship to the App Store

1. Join the Apple Developer Program: USD 99/year (about AED 365). Enroll as an
   organisation if you want the company name on the listing (needs a D-U-N-S number).
2. In App Store Connect, create the app with the same Bundle ID.
3. In Xcode: **Product > Archive > Distribute App > App Store Connect**.
4. Test it through TestFlight first.
5. Fill in the listing: screenshots (6.9" iPhone), description, privacy policy URL,
   support URL, and the App Privacy questionnaire (you collect email, name and usage
   data).
6. Give the reviewer a **demo account** (email + password) in the review notes.

## Review risks to know about

- **Guideline 4.2 (minimum functionality).** Apple sometimes rejects apps that are
  "just a website". The native navigation, keypad, onboarding, reminders, haptics and
  share sheet are there to address this. If it still gets rejected, the next step is a
  home screen widget showing the streak and daily goal.
- **Selling Pro inside the app** later means adding Apple In-App Purchase (RevenueCat
  makes this easier) and letting the existing `profiles.is_pro` flag be set from it.
  Apple takes 15% under the Small Business Program (under USD 1M/year).
