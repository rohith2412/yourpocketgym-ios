import { useMutation } from "@tanstack/react-query";
import { api } from "../../api/client";
import { signInWithGoogle, GoogleCancelled } from "./googleSignIn";
import { saveSession, type AuthUser } from "./session";
import { restoreFromCloud } from "../sync/restore";

type GoogleAuthResponse = {
  success: boolean;
  token: string;
  user: AuthUser;
};

/**
 * Full Google login flow as one mutation:
 *   native Google sign-in → POST /auth/google → persist session.
 * The screen just calls `login()` and reacts to isPending / error / onSuccess.
 */
export function useGoogleLogin(opts?: {
  onSuccess?: (user: AuthUser) => void;
}) {
  return useMutation({
    mutationFn: async (): Promise<AuthUser> => {
      const google = await signInWithGoogle();

      const data = await api.post<GoogleAuthResponse>(
        "/auth/google",
        { idToken: google.idToken },
        { auth: false },
      );

      const user: AuthUser = {
        ...data.user,
        photo: data.user.photo ?? google.photo,
      };
      await saveSession({ token: data.token, user });
      // Pull cloud snapshot so returning users land with their data already in.
      // Silent failure — never blocks login.
      await restoreFromCloud();
      return user;
    },
    onSuccess: (user) => opts?.onSuccess?.(user),
    // Swallow user cancellation — it's not an error to surface.
    onError: (err) => {
      if (err instanceof GoogleCancelled) return;
    },
  });
}

export { GoogleCancelled };
