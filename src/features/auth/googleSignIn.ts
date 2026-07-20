/**
 * Native Google Sign-In wrapper. Returns the Google idToken that the backend
 * verifies. Client ID / URL scheme are public identifiers (also in app.json),
 * not secrets — the real secret lives on the backend.
 */

import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

const IOS_CLIENT_ID =
  "387235327844-liqf9v0o9o6hid6195l0t9qq00png4jc.apps.googleusercontent.com";

// Set this if you add a Web OAuth client (recommended for backend verification).
const WEB_CLIENT_ID = "";

let configured = false;
function configure() {
  if (configured) return;
  GoogleSignin.configure({
    iosClientId: IOS_CLIENT_ID,
    webClientId: WEB_CLIENT_ID || undefined,
    offlineAccess: false,
  });
  configured = true;
}

export type GoogleResult = {
  idToken: string;
  email: string | null;
  name: string | null;
  photo: string | null;
};

export class GoogleCancelled extends Error {}

export async function signInWithGoogle(): Promise<GoogleResult> {
  configure();
  await GoogleSignin.hasPlayServices();

  let response: any;
  try {
    response = await GoogleSignin.signIn();
  } catch (err: any) {
    if (err?.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new GoogleCancelled("cancelled");
    }
    throw err;
  }

  // v13+ returns { type, data }; older returns userInfo directly.
  const info = response?.data ?? response;
  if (!info?.idToken || !info?.user) {
    throw new Error("Google sign-in returned no token");
  }

  return {
    idToken: info.idToken,
    email: info.user.email ?? null,
    name: info.user.name ?? null,
    photo: info.user.photo ?? null,
  };
}
