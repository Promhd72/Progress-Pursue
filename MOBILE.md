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

## Changes made to the web app for iOS

All of these only kick in inside the app. The website behaves exactly as before,
except for account deletion and the logo fix, which apply everywhere.

- **No purchase UI in the app.** Upgrade buttons, the Pro teaser, pricing links and
  "$10/mo" copy are hidden. Apple rejects apps that sell digital upgrades through
  anything other than In-App Purchase (guideline 3.1.1). Users who already have Pro
  on the web keep it in the app.
- **Google sign-in hidden in the app.** Google blocks sign-in inside embedded web
  views, and offering it would also force you to add Sign in with Apple (guideline
  4.8). Email + password works.
- **Account deletion** added to Profile (required by guideline 5.1.1(v)). It cancels
  any active Paddle subscription, then deletes the user and all their data.
- **The landing page is skipped**: the app opens straight to the dashboard (or to
  sign-in).
- **Haptics** on correct and wrong answers and when a lesson finishes.
- **Safe areas** handled for the notch and home indicator. Portrait only, iPhone only.
- Logo fix: the sign-in page and app header said "N" instead of "R".

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
  "just a website". Haptics, native splash, offline handling and the app-first flow
  help. If it gets rejected, the usual next steps are daily streak reminder
  notifications and a home screen widget.
- **Selling Pro inside the app** later means adding Apple In-App Purchase (RevenueCat
  makes this easier) and letting the existing `profiles.is_pro` flag be set from it.
  Apple takes 15% under the Small Business Program (under USD 1M/year).
