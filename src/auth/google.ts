import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

const IOS_CLIENT_ID =
  "387235327844-liqf9v0o9o6hid6195l0t9qq00png4jc.apps.googleusercontent.com";

// If/when you add a Web OAuth client in Google Cloud, put it here so the
// idToken is audience-matched for backend verification.
const WEB_CLIENT_ID = "";

let configured = false;

export const configureGoogleSignin = (): void => {
  if (configured) return;
  GoogleSignin.configure({
    iosClientId: IOS_CLIENT_ID,
    webClientId: WEB_CLIENT_ID || undefined,
    offlineAccess: false,
  });
  configured = true;
};

export type GoogleResult = {
  idToken: string;
  email: string | null;
  name: string | null;
  photo: string | null;
};

export const signInWithGoogle = async (): Promise<GoogleResult | null> => {
  configureGoogleSignin();
  await GoogleSignin.hasPlayServices();

  const response = await GoogleSignin.signIn();

  // v13+ returns { type, data }; older returns the userInfo directly.
  const info: any = (response as any)?.data ?? response;
  if (!info?.idToken || !info?.user) return null;

  return {
    idToken: info.idToken,
    email: info.user.email ?? null,
    name: info.user.name ?? null,
    photo: info.user.photo ?? null,
  };
};

export const isCancelled = (err: any): boolean =>
  err?.code === statusCodes.SIGN_IN_CANCELLED;
