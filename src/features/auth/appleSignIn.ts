/**
 * Sign in with Apple.
 *
 * Required by App Store guideline 4.8 because we offer Google sign-in: users
 * must have an equivalent option that limits data collection to name and email
 * and lets them keep the address private.
 *
 * The one thing worth knowing about this API: Apple hands over `fullName` only
 * on the very first authorization for an app, and never again — not in the
 * identity token, not on later sign-ins. If it isn't captured and sent to the
 * backend right then, that user has no name forever. (Deleting the app doesn't
 * reset it; the user has to revoke it in Settings → Apple ID → Sign in with
 * Apple, which is also how you re-test the first-run path.)
 */

import * as AppleAuthentication from "expo-apple-authentication";

export type AppleResult = {
  identityToken: string;
  /** Present on first authorization only. */
  fullName: string | null;
  /** A private relay address when the user chose to hide it. */
  email: string | null;
};

export class AppleCancelled extends Error {}

/** False on simulators without an Apple ID, and on any non-iOS platform. */
export async function isAppleSignInAvailable(): Promise<boolean> {
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function signInWithApple(): Promise<AppleResult> {
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (err: any) {
    // Dismissing the sheet is a choice, not a failure to report.
    if (err?.code === "ERR_REQUEST_CANCELED") {
      throw new AppleCancelled("cancelled");
    }
    throw err;
  }

  if (!credential.identityToken) {
    throw new Error("Apple sign-in returned no identity token");
  }

  const { givenName, familyName } = credential.fullName ?? {};
  const fullName = [givenName, familyName].filter(Boolean).join(" ").trim();

  return {
    identityToken: credential.identityToken,
    fullName: fullName || null,
    email: credential.email ?? null,
  };
}
