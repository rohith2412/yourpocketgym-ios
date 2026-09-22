import { api } from "../../api/client";

/** Shape returned by GET /api/referrals/mine. */
export type ReferralStatus = {
  code: string;
  balance: number;      // credits earned toward the next month
  pending: number;
  goal: number;         // credits needed per month
  monthsGranted: number;
  adsUntil: string | null;
  adsFree: boolean;
  daysRemaining: number;
  invitees: Array<{
    refereeId: string;
    status: "pending" | "credited" | "rejected";
    createdAt: string;
    creditedAt: string | null;
  }>;
};

export function fetchReferralStatus(): Promise<ReferralStatus> {
  return api.get<ReferralStatus>("/referrals/mine");
}

export function redeemReferralCode(code: string): Promise<{ success: true; pending: true }> {
  return api.post("/referrals/redeem", { code });
}

/**
 * Public-facing share link. Points at the marketing site so an app-less
 * recipient still lands somewhere useful — the landing page detects iOS
 * and hands off to the App Store, then the app reads the code once
 * installed (or the user types it manually during onboarding).
 */
export function shareLinkFor(code: string): string {
  return `https://yourpocketgym.com/i/${code}`;
}
