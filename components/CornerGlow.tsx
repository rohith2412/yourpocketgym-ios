import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

export default function CornerGlow() {
  return (
    <LinearGradient
      colors={[
        "rgba(255, 107, 53, 0.55)",
        "rgba(250, 76, 13, 0.25)",
        "rgba(227, 64, 5, 0.08)",
        "transparent",
      ]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.3, y: 0.5 }}
      style={styles.glow}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  glow: {
    position: "absolute",
    top: -120,
    right: -120,
    width: 700,
    height: 1000,
    borderRadius: 300,
  },
});