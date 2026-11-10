import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Rapid Math iOS app. The app's screens are built into dist/ (npm run build)
 * and bundled inside the app, so it doesn't depend on any website.
 *
 * For live-reload while developing, `npm run ios:dev` points the app at the
 * Vite dev server on your Mac instead (see MOBILE.md).
 *
 * Change `appId` to the Bundle ID you register in App Store Connect before the
 * first build. It can't be changed after the app is published.
 */
const devUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: "app.rapidmath.ios",
  appName: "Rapid Math",
  webDir: "dist",
  ...(devUrl ? { server: { url: devUrl, cleartext: true } } : {}),
  ios: {
    contentInset: "never",
    backgroundColor: "#fafbfc",
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      // Hidden by the app once the first screen has rendered (initNativeShell).
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
