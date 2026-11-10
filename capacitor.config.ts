import type { CapacitorConfig } from "@capacitor/cli";

/**
 * iOS app shell for Rapid Math.
 *
 * The app loads the live Lovable deployment, so every change published in
 * Lovable shows up in the app immediately, with no App Store resubmission
 * (as long as the native side doesn't change). `mobile/www` is only a fallback
 * page shown if the site can't be reached.
 *
 * Change `appId` to the Bundle ID you register in App Store Connect before the
 * first build. It can't be changed after the app is published.
 */
// For testing on a Mac before publishing: `npm run ios:dev` points the app at
// the local dev server instead of the live site (see MOBILE.md).
const devUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: "app.rapidmath.ios",
  appName: "Rapid Math",
  webDir: "mobile/www",
  server: {
    url: devUrl ? `${devUrl}/dashboard` : "https://rapidmath.lovable.app/dashboard",
    cleartext: Boolean(devUrl),
    // Keep Supabase + Lovable auth inside the app instead of bouncing to Safari.
    allowNavigation: ["rapidmath.lovable.app", "*.supabase.co", "*.lovable.app", "*.lovable.dev"],
    errorPath: "offline.html",
  },
  ios: {
    contentInset: "never",
    backgroundColor: "#fafbfc",
    appendUserAgent: "RapidMathApp",
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      // Hidden by the app once the first screen has rendered (initNativeShell),
      // so users never see a blank page loading. 6s safety net in __root.tsx.
      launchAutoHide: false,
      backgroundColor: "#fafbfc",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      overlaysWebView: true,
    },
    Keyboard: {
      resize: "native",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
