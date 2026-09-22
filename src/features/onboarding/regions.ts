// Countries the app supports for pricing / units display. Users typically
// pick their own country; we keep the list short and localised-common.

export type Region = {
  code: string;          // ISO 3166-1 alpha-2
  name: string;
  flag: string;
  units: "metric" | "imperial";
};

export const REGIONS: Region[] = [
  { code: "US", name: "United States",  flag: "🇺🇸", units: "imperial" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", units: "metric" },
  { code: "CA", name: "Canada",         flag: "🇨🇦", units: "metric" },
  { code: "AU", name: "Australia",      flag: "🇦🇺", units: "metric" },
  { code: "NZ", name: "New Zealand",    flag: "🇳🇿", units: "metric" },
  { code: "IE", name: "Ireland",        flag: "🇮🇪", units: "metric" },
  { code: "DE", name: "Germany",        flag: "🇩🇪", units: "metric" },
  { code: "FR", name: "France",         flag: "🇫🇷", units: "metric" },
  { code: "ES", name: "Spain",          flag: "🇪🇸", units: "metric" },
  { code: "IT", name: "Italy",          flag: "🇮🇹", units: "metric" },
  { code: "NL", name: "Netherlands",    flag: "🇳🇱", units: "metric" },
  { code: "SE", name: "Sweden",         flag: "🇸🇪", units: "metric" },
  { code: "NO", name: "Norway",         flag: "🇳🇴", units: "metric" },
  { code: "DK", name: "Denmark",        flag: "🇩🇰", units: "metric" },
  { code: "IN", name: "India",          flag: "🇮🇳", units: "metric" },
  { code: "JP", name: "Japan",          flag: "🇯🇵", units: "metric" },
  { code: "SG", name: "Singapore",      flag: "🇸🇬", units: "metric" },
  { code: "AE", name: "UAE",            flag: "🇦🇪", units: "metric" },
  { code: "BR", name: "Brazil",         flag: "🇧🇷", units: "metric" },
  { code: "MX", name: "Mexico",         flag: "🇲🇽", units: "metric" },
  { code: "ZA", name: "South Africa",   flag: "🇿🇦", units: "metric" },
  { code: "OTHER", name: "Other",       flag: "🌍", units: "metric" },
];

export function findRegion(code?: string | null): Region | undefined {
  return REGIONS.find((r) => r.code === code);
}
