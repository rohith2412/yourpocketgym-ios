import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Image as RNImage } from "react-native";
import * as ImagePicker from "expo-image-picker";
let captureRef: any = null;
try {
  captureRef = require("react-native-view-shot").captureRef;
} catch {}

import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Path, Rect, Line, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";

const LOGO = require("@/assets/images/logo.png");
const BASE_URL = "https://yourpocketgym.com";
const RATINGS_KEY = "@physique_ratings";
const DAILY_LIMIT = 2;
const SCREEN_W = Dimensions.get("window").width;

// ── Types ────────────────────────────────────────────────────────────────────
type CategoryRating = {
  name: string;
  score: number;
  feedback: string;
};

type PhysiqueResult = {
  id: string;
  overallScore: number;
  title: string;
  summary: string;
  categories: CategoryRating[];
  tips: string[];
  photoUri: string;
  createdAt: string;
};

// ── Icons ────────────────────────────────────────────────────────────────────
function CameraIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="13" r="4" stroke="#fff" strokeWidth={1.8} />
    </Svg>
  );
}

function GalleryIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke="#fff" strokeWidth={1.8} />
      <Circle cx="8.5" cy="8.5" r="1.5" fill="#fff" />
      <Path d="M21 15l-5-5L5 21" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShareIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
      <Path d="M16 6l-4-4-4 4" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="2" x2="12" y2="15" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function TrashIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="#e8380d" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const sw = 6;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const progress = score / 10;
  const color = GLOW_ORANGE;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={cx} cy={cx} r={r} stroke="rgba(0,0,0,0.06)" strokeWidth={sw} fill="none" />
        <Circle cx={cx} cy={cx} r={r} stroke={color} strokeWidth={sw} fill="none"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
          strokeLinecap="round" rotation={-90} origin={`${cx},${cx}`} />
      </Svg>
      <Text style={{ fontSize: size * 0.32, fontWeight: "900", color: "#1a1a1a" }}>{score.toFixed(1)}</Text>
      <Text style={{ fontSize: size * 0.1, fontWeight: "600", color: "#aaa" }}>/10</Text>
    </View>
  );
}

// ── Category Card ────────────────────────────────────────────────────────────
const GLOW_ORANGE = "#e8380d";
const BAR_H = 8;
const BAR_SVG_H = 22;

function CategoryCard({ name, score }: { name: string; score: number }) {
  const pct = (score / 10) * 100;
  const id = name.replace(/\s/g, "");

  return (
    <View style={{ flex: 1, borderRadius: 16, overflow: "hidden" }}>
      <LinearGradient colors={["#222222", "#1a1a1a"]} style={{ padding: 14, flex: 1, justifyContent: "space-between" }}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.5)", letterSpacing: 0.5 }}>{name}</Text>
        <Text style={{ fontSize: 28, fontWeight: "900", color: "#fff", marginTop: 4 }}>
          {score.toFixed(1)}
          <Text style={{ fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.3)" }}>/10</Text>
        </Text>
        <View style={{ marginTop: 6 }}>
          <View style={{ height: BAR_H, borderRadius: BAR_H / 2, backgroundColor: "rgba(255,255,255,0.08)" }}>
            <View style={{ width: `${pct}%`, height: BAR_H, borderRadius: BAR_H / 2, backgroundColor: GLOW_ORANGE }} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

// ── Shareable Card ───────────────────────────────────────────────────────────
const ShareableCard = React.forwardRef(({ result }: { result: PhysiqueResult }, ref: any) => {
  return (
    <View ref={ref} collapsable={false}>
      <View style={styles.shareCard}>
        <View style={styles.shareHeader}>
          <Text style={styles.shareHeaderText}>BODY SCORE</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <RNImage source={LOGO} style={{ width: 22, height: 22 }} resizeMode="contain" />
            <Text style={styles.shareBrand}>PocketGym</Text>
          </View>
        </View>

        <View style={styles.shareBody}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <View style={{ width: 90, height: 90, alignItems: "center", justifyContent: "center" }}>
              <Svg width={90} height={90} style={{ position: "absolute" }}>
                <Circle cx={45} cy={45} r={42} stroke="rgba(0,0,0,0.06)" strokeWidth={4} fill="none" />
                <Circle cx={45} cy={45} r={42} stroke={GLOW_ORANGE} strokeWidth={4} fill="none"
                  strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 * (1 - result.overallScore / 10)}
                  strokeLinecap="round" rotation={-90} origin="45,45" />
              </Svg>
              <RNImage source={{ uri: result.photoUri }} style={{ width: 74, height: 74, borderRadius: 37 }} resizeMode="cover" />
            </View>
            <View>
              <Text style={{ fontSize: 30, fontWeight: "900", color: "#1a1a1a" }}>{result.overallScore.toFixed(1)}<Text style={{ fontSize: 15, color: "#aaa" }}>/10</Text></Text>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#999" }}>{result.title}</Text>
            </View>
          </View>

          <View style={{ gap: 8, marginTop: 14 }}>
            {[0, 1, 2].map(row => (
              <View key={row} style={{ flexDirection: "row", gap: 8 }}>
                {result.categories.slice(row * 2, row * 2 + 2).map((cat, i) => {
                  const pct = (cat.score / 10) * 100;
                  return (
                    <View key={i} style={{ flex: 1, backgroundColor: "#1a1a1a", borderRadius: 12, padding: 10 }}>
                      <Text style={{ fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.5)" }}>{cat.name}</Text>
                      <Text style={{ fontSize: 22, fontWeight: "900", color: "#fff", marginTop: 2 }}>
                        {cat.score.toFixed(1)}
                        <Text style={{ fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.3)" }}>/10</Text>
                      </Text>
                      <View style={{ height: BAR_H, borderRadius: BAR_H / 2, backgroundColor: "rgba(255,255,255,0.08)", marginTop: 4 }}>
                        <View style={{ width: `${pct}%`, height: BAR_H, borderRadius: BAR_H / 2, backgroundColor: GLOW_ORANGE }} />
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.shareFooter}>
          <Text style={styles.shareFooterText}>Rated by PocketGym </Text>
          <Text style={styles.shareFooterDate}>{new Date(result.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
    </View>
  );
});

// ── Result View ──────────────────────────────────────────────────────────────
function ResultView({ result, onShare, onBack, sharing }: {
  result: PhysiqueResult;
  onShare: () => void;
  onBack: () => void;
  sharing: boolean;
}) {
  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 8 }}>
      <Pressable onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backBtnText}>← Back</Text>
      </Pressable>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 12, gap: 20 }}>
        <View style={{ width: 100, height: 100, alignItems: "center", justifyContent: "center" }}>
          <Svg width={100} height={100} style={{ position: "absolute" }}>
            <Circle cx={50} cy={50} r={47} stroke="rgba(0,0,0,0.06)" strokeWidth={4} fill="none" />
            <Circle cx={50} cy={50} r={47} stroke={GLOW_ORANGE} strokeWidth={4} fill="none"
              strokeDasharray={2 * Math.PI * 47} strokeDashoffset={2 * Math.PI * 47 * (1 - result.overallScore / 10)}
              strokeLinecap="round" rotation={-90} origin="50,50" />
          </Svg>
          <Image source={result.photoUri} style={{ width: 84, height: 84, borderRadius: 42 }} contentFit="cover" />
        </View>
        <View>
          <Text style={{ fontSize: 34, fontWeight: "900", color: "#1a1a1a" }}>{result.overallScore.toFixed(1)}<Text style={{ fontSize: 18, color: "#aaa" }}>/10</Text></Text>
          <Text style={styles.resultTitle}>{result.title}</Text>
        </View>
      </View>

      <View style={styles.catsCard}>
        <Text style={styles.catsCardTitle}>BREAKDOWN</Text>
        <View style={{ flex: 1, gap: 10 }}>
          {[0, 1, 2].map(row => (
            <View key={row} style={{ flex: 1, flexDirection: "row", gap: 10 }}>
              {result.categories.slice(row * 2, row * 2 + 2).map((cat, i) => (
                <CategoryCard key={i} name={cat.name} score={cat.score} />
              ))}
            </View>
          ))}
        </View>
      </View>

      <Pressable onPress={onShare} disabled={sharing} style={[styles.shareBtn, { marginTop: 12 }]}>
        {sharing ? <ActivityIndicator color="#fff" size="small" /> : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <ShareIcon />
            <Text style={styles.shareBtnText}>Share My Rating</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

// ── History Card ─────────────────────────────────────────────────────────────
function HistoryCard({ result, onPress, onDelete }: { result: PhysiqueResult; onPress: () => void; onDelete: () => void }) {
  const color = GLOW_ORANGE;
  return (
    <Pressable onPress={onPress} style={styles.historyCard}>
      <Image source={result.photoUri} style={styles.historyPhoto} contentFit="cover" />
      <View style={styles.historyInfo}>
        <Text style={styles.historyScore}>
          <Text style={{ color }}>{result.overallScore.toFixed(1)}</Text>/10
        </Text>
        <Text style={styles.historyTitle} numberOfLines={1}>{result.title}</Text>
        <Text style={styles.historyDate}>{new Date(result.createdAt).toLocaleDateString()}</Text>
      </View>
      <Pressable onPress={onDelete} hitSlop={10} style={styles.historyDelete}>
        <TrashIcon />
      </Pressable>
    </Pressable>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function PhysiqueRating({ token, userId }: { token: string; userId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PhysiqueResult | null>(null);
  const [history, setHistory] = useState<PhysiqueResult[]>([]);
  const [sharing, setSharing] = useState(false);
  const [viewingResult, setViewingResult] = useState<PhysiqueResult | null>(null);
  const cardRef = useRef<any>(null);

  const storageKey = userId ? `${RATINGS_KEY}/${userId}` : null;

  useEffect(() => {
    if (!storageKey) return;
    AsyncStorage.getItem(storageKey).then(raw => {
      if (raw) try { setHistory(JSON.parse(raw)); } catch {}
    });
  }, [storageKey]);

  const saveHistory = useCallback(async (items: PhysiqueResult[]) => {
    if (!storageKey) return;
    setHistory(items);
    await AsyncStorage.setItem(storageKey, JSON.stringify(items)).catch(() => {});
  }, [storageKey]);

  const pickImage = async (source: "camera" | "gallery") => {
    const opts: ImagePicker.ImagePickerOptions = {
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
      base64: true,
    };

    let pickerResult;
    if (source === "camera") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert("Permission needed", "Camera access is required."); return; }
      pickerResult = await ImagePicker.launchCameraAsync(opts);
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert("Permission needed", "Photo library access is required."); return; }
      pickerResult = await ImagePicker.launchImageLibraryAsync(opts);
    }

    if (pickerResult.canceled || !pickerResult.assets?.[0]) return;

    const asset = pickerResult.assets[0];
    analyzePhoto(asset.uri, asset.base64!);
  };

  const callPhysiqueAPI = async (base64: string): Promise<string> => {
    const res = await fetch(`${BASE_URL}/api/ai-trainer`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        type: "chat",
        image: `data:image/jpeg;base64,${base64}`,
        messages: [
          {
            role: "user",
            content: `Analyze this physique photo. Respond with ONLY a raw JSON object — no text before or after, no markdown, no code fences. Format:
{"overallScore":7.5,"title":"Athletic Build","summary":"Brief 1-2 sentence assessment","categories":[{"name":"Upper Body","score":7.0,"feedback":"Brief feedback"},{"name":"Core","score":8.0,"feedback":"Brief feedback"},{"name":"Lower Body","score":7.5,"feedback":"Brief feedback"},{"name":"Symmetry","score":7.0,"feedback":"Brief feedback"},{"name":"Definition","score":6.5,"feedback":"Brief feedback"},{"name":"Posture","score":8.0,"feedback":"Brief feedback"}],"tips":["Tip 1","Tip 2","Tip 3"]}`,
          },
        ],
        extra: {
          systemNote: "You are a physique rating AI. Output ONLY valid JSON. No prose, no markdown fences, no explanation. Scores 1-10. Be encouraging but honest.",
        },
      }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to analyze");
    return json.data?.reply || "";
  };

  const parsePhysiqueReply = (reply: string) => {
    const cleaned = reply.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    return JSON.parse(jsonMatch[0]);
  };

  const getTodayKey = () => `@physique_daily_${userId}_${new Date().toISOString().slice(0, 10)}`;

  const analyzePhoto = async (uri: string, base64: string) => {
    const dayKey = getTodayKey();
    const countRaw = await AsyncStorage.getItem(dayKey).catch(() => null);
    const count = countRaw ? parseInt(countRaw, 10) : 0;
    if (count >= DAILY_LIMIT) {
      Alert.alert("Daily Limit Reached", `You can only rate ${DAILY_LIMIT} photos per day. Come back tomorrow!`);
      return;
    }

    setLoading(true);
    try {
      let parsed;
      for (let attempt = 0; attempt < 2; attempt++) {
        const reply = await callPhysiqueAPI(base64);
        console.log("[PhysiqueRating] Attempt", attempt + 1, "reply:", reply.slice(0, 300));
        try {
          parsed = parsePhysiqueReply(reply);
          break;
        } catch {
          if (attempt === 1) throw new Error("AI didn't return a valid rating. Please try again.");
        }
      }

      if (parsed.error) {
        Alert.alert("Invalid Photo", parsed.error);
        setLoading(false);
        return;
      }

      const newResult: PhysiqueResult = {
        id: Date.now().toString(),
        overallScore: parsed.overallScore,
        title: parsed.title,
        summary: parsed.summary,
        categories: parsed.categories,
        tips: parsed.tips || [],
        photoUri: uri,
        createdAt: new Date().toISOString(),
      };

      setResult(newResult);
      const updated = [newResult, ...history].slice(0, 20);
      await saveHistory(updated);
      await AsyncStorage.setItem(dayKey, String(count + 1)).catch(() => {});
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to analyze photo. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const target = viewingResult || result;
    if (!target || !cardRef.current) return;
    setSharing(true);
    try {
      if (!captureRef) {
        await Share.share({ message: `I scored ${target.overallScore.toFixed(1)}/10 on my physique rating! 💪 Check it out on PocketGym AI.` });
        return;
      }
      const uri = await captureRef(cardRef, { format: "png", quality: 1 });
      await Share.share(Platform.OS === "ios" ? { url: uri } : { message: "Check out my body score!", url: uri });
    } catch (err: any) {
      if (!err.message?.includes("cancel") && !err.message?.includes("dismissed")) {
        Alert.alert("Error", "Could not share. Please try again.");
      }
    } finally {
      setSharing(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Rating", "Remove this rating?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          const updated = history.filter(h => h.id !== id);
          await saveHistory(updated);
          if (viewingResult?.id === id) setViewingResult(null);
          if (result?.id === id) setResult(null);
        },
      },
    ]);
  };

  const activeResult = viewingResult || result;

  // ── Analyzing overlay ──
  if (loading) {
    return (
      <View style={styles.centered}>
        <View style={styles.analyzingCard}>
          <ActivityIndicator size="large" color="#e8380d" />
          <Text style={styles.analyzingTitle}>Analyzing your physique...</Text>
          <Text style={styles.analyzingSub}>Our AI is rating your build</Text>
        </View>
      </View>
    );
  }

  // ── Result view ──
  if (activeResult) {
    return (
      <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <ResultView
          result={activeResult}
          onShare={handleShare}
          onBack={() => { setViewingResult(null); setResult(null); }}
          sharing={sharing}
        />
        {/* Hidden shareable card for capture */}
        <View style={{ position: "absolute", left: -9999, top: 0 }}>
          <ShareableCard ref={cardRef} result={activeResult} />
        </View>
      </View>
    );
  }

  // ── Upload + history view ──
  return (
    <ScrollView style={{ backgroundColor: "#ffffff" }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16, paddingBottom: 120, gap: 16 }}>
      {/* Upload card */}
      <View style={styles.uploadCard}>
        <Text style={styles.uploadTitle}>Rate My Body</Text>
        <Text style={styles.uploadSub}>Upload a photo and let AI rate your build with a shareable score card</Text>

        <View style={styles.uploadBtns}>
          <Pressable onPress={() => pickImage("camera")} style={styles.uploadBtn}>
            <CameraIcon />
            <Text style={styles.uploadBtnText}>Camera</Text>
          </Pressable>
          <Pressable onPress={() => pickImage("gallery")} style={styles.uploadBtn}>
            <GalleryIcon />
            <Text style={styles.uploadBtnText}>Gallery</Text>
          </Pressable>
        </View>

        <Text style={styles.uploadHint}>For best results, use a well-lit front or side pose</Text>
      </View>

      {/* History */}
      {history.length > 0 && (
        <View style={{ gap: 10 }}>
          <Text style={styles.sectionLabel}>PREVIOUS RATINGS</Text>
          {history.map(item => (
            <HistoryCard
              key={item.id}
              result={item}
              onPress={() => setViewingResult(item)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Analyzing
  analyzingCard: { alignItems: "center", gap: 16, padding: 40 },
  analyzingTitle: { fontSize: 18, fontWeight: "800", color: "#1a1a1a", letterSpacing: -0.5 },
  analyzingSub: { fontSize: 14, color: "#aaa" },

  // Upload
  uploadCard: { backgroundColor: "#1a1a1a", borderRadius: 24, padding: 28, alignItems: "center", gap: 12 },
  uploadTitle: { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  uploadSub: { fontSize: 14, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 21 },
  uploadBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  uploadBtn: { flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 16, paddingVertical: 20, alignItems: "center", gap: 8 },
  uploadBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  uploadHint: { fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 },

  // Back
  backBtn: { paddingVertical: 8, alignSelf: "flex-start" },
  backBtnText: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },

  // Result
  resultHeader: { },
  resultTitle: { fontSize: 13, fontWeight: "600", color: "#999" },
  resultSummary: { fontSize: 14, color: "#666", lineHeight: 22 },

  // Categories
  catsCard: { flex: 1, paddingTop: 8, paddingBottom: 8 },
  catsCardTitle: { fontSize: 11, fontWeight: "700", color: "#aaa", letterSpacing: 1.5, marginBottom: 8 },
  catName: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  catBarBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" },
  catBarFill: { height: 6, borderRadius: 3 },
  catFeedback: { fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  catScore: { fontSize: 13, fontWeight: "800", color: "#fff", width: 34, textAlign: "right" },

  // Tips
  tipsCard: { backgroundColor: "#fff", borderRadius: 20, padding: 18, borderWidth: 1, borderColor: "rgba(0,0,0,0.05)" },
  tipsTitle: { fontSize: 11, fontWeight: "700", color: "#aaa", letterSpacing: 1.5, marginBottom: 14 },
  tipRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 12 },
  tipNum: { width: 22, height: 22, borderRadius: 7, backgroundColor: "rgba(232,56,13,0.08)", alignItems: "center", justifyContent: "center" },
  tipNumText: { fontSize: 11, fontWeight: "800", color: "#e8380d" },
  tipText: { fontSize: 14, color: "#555", lineHeight: 21, flex: 1 },

  // Share button
  shareBtn: { backgroundColor: "#1a1a1a", borderRadius: 16, paddingVertical: 18, alignItems: "center" },
  shareBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  // History
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: "#aaa" },
  historyCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 20, padding: 12, borderWidth: 1, borderColor: "rgba(0,0,0,0.05)", gap: 14 },
  historyPhoto: { width: 56, height: 72, borderRadius: 14 },
  historyInfo: { flex: 1, gap: 2 },
  historyScore: { fontSize: 20, fontWeight: "900", color: "#1a1a1a" },
  historyTitle: { fontSize: 14, fontWeight: "600", color: "#555" },
  historyDate: { fontSize: 12, color: "#bbb" },
  historyDelete: { padding: 8 },

  // Shareable card
  shareCard: { width: 360, backgroundColor: "#fff", borderRadius: 24, overflow: "hidden" },
  shareHeader: { backgroundColor: "#fff", paddingVertical: 16, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" },
  shareHeaderText: { fontSize: 12, fontWeight: "800", color: "#aaa", letterSpacing: 2 },
  shareBrand: { fontSize: 14, fontWeight: "800", color: "#1a1a1a" },
  shareBody: { padding: 20, gap: 16 },
  sharePhotoRow: { flexDirection: "row", gap: 16, alignItems: "center" },
  sharePhoto: { width: 110, height: 140, borderRadius: 16 },
  shareScoreCol: { flex: 1, alignItems: "center", gap: 6 },
  shareTitle: { fontSize: 16, fontWeight: "800", color: "#1a1a1a", textAlign: "center" },
  shareCats: { gap: 12 },
  shareCatBarBg: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.05)", overflow: "hidden" },
  shareCatBarFill: { height: 8, borderRadius: 4 },
  shareCatScore: { fontSize: 12, fontWeight: "800", color: "#1a1a1a", width: 30, textAlign: "right" },
  shareFooter: { backgroundColor: "#fafaf8", paddingVertical: 12, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between" },
  shareFooterText: { fontSize: 11, fontWeight: "700", color: "#ccc" },
  shareFooterDate: { fontSize: 11, color: "#ccc" },
});
