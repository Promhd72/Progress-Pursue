// Client-safe metadata about Advanced scenario domains (no answers here).
export const ADVANCED_DOMAINS = ["general", "sales", "marketing", "finance"] as const;
export type AdvancedDomain = (typeof ADVANCED_DOMAINS)[number];

export const ADVANCED_DOMAIN_LABELS: Record<AdvancedDomain, string> = {
  general: "General business",
  sales: "Sales",
  marketing: "Marketing",
  finance: "Finance",
};

export const ADVANCED_DOMAIN_BLURBS: Record<AdvancedDomain, string> = {
  general: "Everyday work math: splits, headcount, quick ratios.",
  sales: "Discounts, quotas and deal maths you defend live.",
  marketing: "Funnels, CAC, growth rates and channel trade-offs.",
  finance: "Margins, runway, revenue mix and unit economics.",
};

export const ADVANCED_DOMAIN_SYMBOL: Record<AdvancedDomain, string> = {
  general: "◆",
  sales: "↗",
  marketing: "◎",
  finance: "$",
};
