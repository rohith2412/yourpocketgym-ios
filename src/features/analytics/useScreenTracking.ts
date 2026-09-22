import { useEffect } from "react";
import { trackScreen } from "./track";

/**
 * Fires a single `screen_view` event on mount. Screens that use this hook
 * automatically show up in the admin analytics dashboard.
 *
 * Route change de-dupe is handled inside `trackScreen` (it drops repeats
 * of the same screen name), so it's safe to call unconditionally from
 * every top-level screen component.
 */
export function useScreenTracking(name: string) {
  useEffect(() => {
    trackScreen(name);
  }, [name]);
}
