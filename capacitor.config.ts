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
const config: CapacitorConfig = {
  appId: "app.rapidmath.ios",
  appName: "Rapid Math",
  webDir: "mobile/www",
  server: {
    url: "https://rapidmath.lovable.app/dashboard",
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
      launchShowDuration: 3000,
      launchAutoHide: true,
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
