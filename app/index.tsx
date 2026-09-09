import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { getToken } from "../src/auth/storage";

/**
 * Entry route. Just a switch — signed-in users go straight into the tabs,
 * everyone else lands on the v2 Welcome screen. The old version of this file
 * was a 187-line v1 landing page with its own animated hero and buttons; that
 * is what was silently sending returning users into the old Tracker UI.
 */
export default function Index() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      setSignedIn(!!token);
      setReady(true);
    })();
  }, []);

  if (!ready) {
    // Splash keeps painting until we know where to send them.
    return <View style={{ flex: 1, backgroundColor: "#000" }} />;
  }
  return <Redirect href={signedIn ? "/(tabs)" : "/welcome"} />;
}
