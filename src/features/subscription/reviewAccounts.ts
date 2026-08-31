/**
 * Accounts that are granted Pro without a purchase.
 *
 * These exist so Apple's App Review team can exercise every Pro surface (Coach,
 * scanner, voice log, Recovery, Sync) using the demo credentials supplied in
 * App Store Connect → App Review Information, without having to complete a
 * sandbox purchase first.
 *
 * Keep this list tiny and review it before each submission — anyone who signs
 * up with one of these addresses gets Pro for free.
 */
const REVIEW_ACCOUNTS = new Set<string>([
  "duck@gmail.com", // App Store review demo account
]);

export function isReviewAccount(email?: string | null): boolean {
  if (!email) return false;
  return REVIEW_ACCOUNTS.has(email.trim().toLowerCase());
}
