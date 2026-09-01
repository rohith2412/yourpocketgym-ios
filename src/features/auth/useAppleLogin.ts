import { useMutation } from "@tanstack/react-query";
import { api } from "../../api/client";
import { signInWithApple, AppleCancelled } from "./appleSignIn";
import { saveSession, type AuthUser } from "./session";
import { restoreFromCloud } from "../sync/restore";

type AppleAuthResponse = {
  success: boolean;
  token: string;
  user: AuthUser;
};

/**
 * Full Apple login flow as one mutation:
 *   native Apple sign-in → POST /auth/apple → persist session.
 * Deliberately the same shape as `useGoogleLogin` so the two buttons on the
 * welcome screen behave identically.
 */
export function useAppleLogin(opts?: { onSuccess?: (user: AuthUser) => void }) {
  return useMutation({
    mutationFn: async (): Promise<AuthUser> => {
      const apple = await signInWithApple();

      const data = await api.post<AppleAuthResponse>(
        "/auth/apple",
        // `fullName` is only non-null on the first authorization; the backend
        // stores it then, because Apple will never send it again.
        { identityToken: apple.identityToken, fullName: apple.fullName },
        { auth: false },
      );

      await saveSession({ token: data.token, user: data.user });
      // Pull cloud snapshot so returning users land with their data already in.
      // Silent failure — never blocks login.
      await restoreFromCloud();
      return data.user;
    },
    onSuccess: (user) => opts?.onSuccess?.(user),
    onError: (err) => {
      if (err instanceof AppleCancelled) return;
    },
  });
}

export { AppleCancelled };
