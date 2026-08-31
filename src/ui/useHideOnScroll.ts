import { useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

/**
 * Hide a floating control while the user scrolls down, bring it back when they
 * scroll up — the pattern most apps use so a FAB doesn't sit on top of the
 * content you're trying to read.
 *
 * Wire `onScroll` to the ScrollView and pass `hidden` to the control.
 */
export function useHideOnScroll({
  /** Ignore jitter below this, so the control doesn't flicker mid-gesture. */
  threshold = 10,
  /** Always visible near the top, where nothing is being covered anyway. */
  topSafeZone = 60,
} = {}) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const y = contentOffset.y;
    const maxY = contentSize.height - layoutMeasurement.height;

    // iOS rubber-banding runs *backwards* as it settles: after a fling to the
    // bottom the offset walks back up, which reads as a scroll-up and pops the
    // control straight back out. Track the position but don't act on it while
    // we're past either end.
    if (y <= 0 || y >= maxY) {
      lastY.current = y;
      return;
    }

    const dy = y - lastY.current;
    if (Math.abs(dy) < threshold) return;
    lastY.current = y;
    setHidden(dy > 0 && y > topSafeZone);
  };

  return { hidden, onScroll };
}
