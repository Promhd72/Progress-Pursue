// Privacy Policy and Terms of Use shown inside the app (Profile, sign-up and
// the Pro screen). Keep site/privacy.html and site/terms.html in step with this.

export const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? "";
/** Apple's standard licence agreement, which also applies to this app. */
export const APPLE_EULA_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
export const LEGAL_UPDATED = "November 2026";

export type LegalDoc = "privacy" | "terms";
export type LegalSection = { heading: string; body?: string; bullets?: string[] };

const contact = SUPPORT_EMAIL
  ? `Email ${SUPPORT_EMAIL}, or message us in the app: Profile > Send feedback.`
  : "Message us in the app: Profile > Send feedback.";

export const LEGAL: Record<LegalDoc, { title: string; intro: string; sections: LegalSection[] }> = {
  privacy: {
    title: "Privacy Policy",
    intro:
      "Rapid Math is a mental maths training app. This policy explains what we collect, why, and the choices you have. We collect as little as we can.",
    sections: [
      {
        heading: "What we collect",
        bullets: [
          "Account details: your email address, the name you enter, and a password. Passwords are stored in hashed form by our database provider; we can't read them.",
          "Training data: lesson and placement results, scenario answers, XP, streaks and levels.",
          "Subscription status: whether Rapid Math Pro is active and when it renews or ends. Payments are handled by Apple. We never see your card or payment details.",
          "Messages you send us: feedback and feature requests, with your email, app version and device type so we can reply and fix problems.",
        ],
      },
      {
        heading: "Stored on your device only",
        body: "Your goal, daily target, reminder time, confidence check-ins, warm-up scores and which tips you've read stay on your phone and are not sent to us.",
      },
      {
        heading: "What we don't do",
        bullets: [
          "No advertising and no ad tracking.",
          "No third-party analytics.",
          "We don't sell or rent your data.",
          "We don't track you across other apps or websites.",
        ],
      },
      {
        heading: "How we use your data",
        body: "Only to run the app: saving your progress, working out streaks and levels, unlocking Pro, letting you sign in on another device, and replying to your messages.",
      },
      {
        heading: "Who helps us run the app",
        bullets: [
          "Supabase: stores your account and training data and handles sign-in.",
          "Apple: processes subscription payments through the App Store.",
          "RevenueCat: confirms your subscription status with Apple. It receives an anonymous account ID and your purchase history for this app, not your name or email.",
        ],
        body: "These providers process data on our behalf and only for these purposes.",
      },
      {
        heading: "Notifications",
        body: "Daily reminders are optional and scheduled on your iPhone. Turn them off any time in Profile or in iPhone Settings.",
      },
      {
        heading: "Keeping and deleting your data",
        body: "We keep your data while you have an account. You can permanently delete your account and everything linked to it, including messages you sent us, in the app: Profile > Delete account. Deletion is immediate and can't be undone. Deleting your account doesn't cancel an App Store subscription: cancel it in iPhone Settings > your name > Subscriptions.",
      },
      {
        heading: "Children",
        body: "Rapid Math is made for adults and is not directed at children under 13. We don't knowingly collect data from children under 13.",
      },
      {
        heading: "Changes",
        body: "If we change this policy we'll update the date above and, for significant changes, tell you in the app.",
      },
      { heading: "Contact", body: contact },
    ],
  },
  terms: {
    title: "Terms of Use",
    intro:
      "By using Rapid Math you agree to these terms and to Apple's standard Licensed Application End User License Agreement (EULA), linked below.",
    sections: [
      {
        heading: "Using the app",
        body: "Rapid Math is for personal, non-commercial use. Keep your sign-in details private, and don't misuse the app or try to disrupt it.",
      },
      {
        heading: "Rapid Math Pro",
        bullets: [
          "Pro is an auto-renewing subscription, billed monthly or yearly through your Apple Account.",
          "If you start with a free trial, you won't be charged during the trial. When it ends, the subscription starts and you're charged the price shown, unless you cancel at least 24 hours before the trial ends.",
          "The subscription renews automatically unless you cancel at least 24 hours before the end of the current period.",
          "Manage or cancel any time in iPhone Settings > your name > Subscriptions. Deleting the app or your account doesn't cancel it.",
          "Prices are shown in the app before you buy and may vary by country. Refunds are handled by Apple.",
        ],
      },
      {
        heading: "Free plan",
        body: "The free plan includes a limited number of levels, lessons and scenarios each day. We may adjust what's included from time to time.",
      },
      {
        heading: "Educational purpose",
        body: "Rapid Math is a training tool. Results vary from person to person, and nothing in the app is financial, professional or medical advice.",
      },
      {
        heading: "Your account",
        body: "You can delete your account at any time in Profile > Delete account. We may suspend accounts that abuse the service.",
      },
      {
        heading: "Liability",
        body: "The app is provided as is. To the extent the law allows, we aren't liable for indirect or consequential losses from using it.",
      },
      { heading: "Contact", body: contact },
    ],
  },
};
