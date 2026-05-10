/**
 * MealPlanEditPrefs — classic iOS grouped-table settings style.
 * Rows with labels on the left, checkmarks on the right. Plain and familiar.
 */
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { MealPreferences } from "../src/utils/mealPlanGenerator";

const BLUE  = "#007AFF"; // classic iOS blue
const INK   = "#000";
const MUTED = "#8e8e93"; // iOS secondary label
const BG    = "#f2f2f7"; // iOS grouped background
const WHITE = "#ffffff";
const SEP   = "#c6c6c8"; // iOS separator

// ── Data ──────────────────────────────────────────────────────────────────────

const GOALS = [
  { key: "lose_weight", label: "Lose Weight",  detail: "Calorie deficit, high protein" },
  { key: "maintain",    label: "Maintain",     detail: "Balanced macros & calories" },
  { key: "gain_muscle", label: "Gain Muscle",  detail: "High protein, calorie surplus" },
  { key: "gain_weight", label: "Gain Weight",  detail: "Dense calories, frequent meals" },
] as const;

const DIETS = [
  { key: "vegetarian",  label: "Vegetarian",  detail: "No meat or fish" },
  { key: "vegan",       label: "Vegan",        detail: "No animal products" },
  { key: "gluten-free", label: "Gluten-Free",  detail: "No wheat, rye, barley" },
  { key: "dairy-free",  label: "Dairy-Free",   detail: "No milk products" },
];

const ALLERGIES_LIST = [
  { key: "nuts",      label: "Tree Nuts" },
  { key: "shellfish", label: "Shellfish" },
  { key: "eggs",      label: "Eggs" },
  { key: "soy",       label: "Soy" },
  { key: "gluten",    label: "Gluten" },
  { key: "dairy",     label: "Dairy" },
];

const CUISINES = [
  { key: "italian",        label: "Italian" },
  { key: "japanese",       label: "Japanese" },
  { key: "mexican",        label: "Mexican" },
  { key: "indian",         label: "Indian" },
  { key: "chinese",        label: "Chinese" },
  { key: "mediterranean",  label: "Mediterranean" },
  { key: "thai",           label: "Thai" },
  { key: "american",       label: "American" },
  { key: "korean",         label: "Korean" },
  { key: "french",         label: "French" },
  { key: "middle_eastern", label: "Middle Eastern" },
  { key: "greek",          label: "Greek" },
  { key: "spanish",        label: "Spanish" },
  { key: "vietnamese",     label: "Vietnamese" },
  { key: "african",        label: "African" },
  { key: "moroccan",       label: "Moroccan" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

// ── Reusable row components ───────────────────────────────────────────────────

function GroupHeader({ title }: { title: string }) {
  return <Text style={s.groupHeader}>{title}</Text>;
}

function GroupFooter({ text }: { text: string }) {
  return <Text style={s.groupFooter}>{text}</Text>;
}

/** White grouped section wrapping a list of rows */
function Group({ children }: { children: React.ReactNode }) {
  return <View style={s.group}>{children}</View>;
}

/** A single tappable row with optional checkmark */
function SelectRow({
  label, detail, checked, onPress, isLast = false,
}: {
  label: string; detail?: string; checked: boolean;
  onPress: () => void; isLast?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.row, pressed && s.rowPressed]}>
      <View style={s.rowLeft}>
        <Text style={s.rowLabel}>{label}</Text>
        {detail ? <Text style={s.rowDetail}>{detail}</Text> : null}
      </View>
      {checked && <Text style={s.checkmark}>✓</Text>}
      {!isLast && <View style={s.sep} />}
    </Pressable>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  initial: MealPreferences;
  onSave: (prefs: MealPreferences) => void;
  onClose: () => void;
}

export default function MealPlanEditPrefs({ visible, initial, onSave, onClose }: Props) {
  const [prefs,   setPrefs]   = useState<MealPreferences>({ ...initial });
  const [calText, setCalText] = useState(String(initial.calorieTarget));

  const handleShow = () => {
    setPrefs({ ...initial });
    setCalText(String(initial.calorieTarget));
  };

  const set = <K extends keyof MealPreferences>(key: K, val: MealPreferences[K]) =>
    setPrefs((p) => ({ ...p, [key]: val }));

  const handleSave = () => {
    const parsed = parseInt(calText, 10);
    onSave({
      ...prefs,
      calorieTarget: !isNaN(parsed) && parsed >= 800 ? parsed : prefs.calorieTarget,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={handleShow}
    >
      <View style={s.root}>

        {/* ── Nav bar ── */}
        <View style={s.navBar}>
          <Pressable onPress={onClose} style={s.navBtn}>
            <Text style={s.navCancel}>Cancel</Text>
          </Pressable>
          <Text style={s.navTitle}>Meal Preferences</Text>
          <Pressable onPress={handleSave} style={s.navBtn}>
            <Text style={s.navSave}>Save</Text>
          </Pressable>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Goal ── */}
          <GroupHeader title="GOAL" />
          <Group>
            {GOALS.map((g, i) => (
              <SelectRow
                key={g.key}
                label={g.label}
                detail={g.detail}
                checked={prefs.goal === g.key}
                onPress={() => set("goal", g.key)}
                isLast={i === GOALS.length - 1}
              />
            ))}
          </Group>

          {/* ── Daily calories ── */}
          <GroupHeader title="DAILY CALORIES" />
          <Group>
            {([1500, 2000, 2500, 3000] as const).map((cal, i, arr) => (
              <SelectRow
                key={cal}
                label={`${cal} cal`}
                checked={prefs.calorieTarget === cal}
                onPress={() => { set("calorieTarget", cal); setCalText(String(cal)); }}
                isLast={i === arr.length - 1}
              />
            ))}
          </Group>
          <Group>
            <View style={[s.row, { paddingVertical: 12 }]}>
              <Text style={s.rowLabel}>Custom</Text>
              <TextInput
                style={s.calInput}
                value={calText}
                onChangeText={(t) => {
                  setCalText(t);
                  const n = parseInt(t, 10);
                  if (!isNaN(n) && n >= 800) set("calorieTarget", n);
                }}
                keyboardType="number-pad"
                placeholder="e.g. 2200"
                placeholderTextColor={MUTED}
                returnKeyType="done"
                textAlign="right"
              />
              <Text style={[s.rowDetail, { marginLeft: 4 }]}>cal</Text>
            </View>
          </Group>
          <GroupFooter text="Enter a custom calorie target or pick one of the presets above." />

          {/* ── Meals per day ── */}
          <GroupHeader title="MEALS PER DAY" />
          <Group>
            {([3, 4, 5] as const).map((n, i, arr) => (
              <SelectRow
                key={n}
                label={`${n} meals`}
                checked={prefs.mealsPerDay === n}
                onPress={() => set("mealsPerDay", n)}
                isLast={i === arr.length - 1}
              />
            ))}
          </Group>

          {/* ── Snacks & cooking time ── */}
          <GroupHeader title="OPTIONS" />
          <Group>
            <View style={s.row}>
              <View style={s.rowLeft}>
                <Text style={s.rowLabel}>Include Snacks</Text>
              </View>
              <Switch
                value={prefs.includeSnacks}
                onValueChange={(v) => set("includeSnacks", v)}
                trackColor={{ false: "#e0e0e0", true: BLUE }}
                thumbColor={WHITE}
              />
              <View style={s.sep} />
            </View>
            <Pressable
              onPress={() => set("cookingTime", prefs.cookingTime === "quick" ? "any" : "quick")}
              style={({ pressed }) => [s.row, pressed && s.rowPressed]}
            >
              <View style={s.rowLeft}>
                <Text style={s.rowLabel}>Quick Meals Only</Text>
                <Text style={s.rowDetail}>Under 15 minutes</Text>
              </View>
              {prefs.cookingTime === "quick" && <Text style={s.checkmark}>✓</Text>}
            </Pressable>
          </Group>

          {/* ── Dietary restrictions ── */}
          <GroupHeader title="DIETARY RESTRICTIONS" />
          <Group>
            {DIETS.map((d, i) => (
              <SelectRow
                key={d.key}
                label={d.label}
                detail={d.detail}
                checked={prefs.dietaryRestrictions.includes(d.key)}
                onPress={() => set("dietaryRestrictions", toggle(prefs.dietaryRestrictions, d.key))}
                isLast={i === DIETS.length - 1}
              />
            ))}
          </Group>
          <GroupFooter text="Select all that apply. Multiple restrictions are supported." />

          {/* ── Allergies ── */}
          <GroupHeader title="ALLERGIES" />
          <Group>
            {ALLERGIES_LIST.map((a, i) => (
              <SelectRow
                key={a.key}
                label={a.label}
                checked={prefs.allergies.includes(a.key)}
                onPress={() => set("allergies", toggle(prefs.allergies, a.key))}
                isLast={i === ALLERGIES_LIST.length - 1}
              />
            ))}
          </Group>

          {/* ── Cuisines ── */}
          <GroupHeader title="CUISINE PREFERENCES" />
          <Group>
            {CUISINES.map((c, i) => (
              <SelectRow
                key={c.key}
                label={c.label}
                checked={prefs.cuisinePreferences.includes(c.key)}
                onPress={() => set("cuisinePreferences", toggle(prefs.cuisinePreferences, c.key))}
                isLast={i === CUISINES.length - 1}
              />
            ))}
          </Group>
          <GroupFooter text="Leave empty to include all cuisines." />

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: BG },
  scroll:      { flex: 1 },
  scrollContent: { paddingTop: 20, paddingBottom: 40 },

  // Nav bar
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: BG,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SEP,
  },
  navBtn:    { minWidth: 60 },
  navTitle:  { fontSize: 17, fontWeight: "600", color: INK },
  navCancel: { fontSize: 17, color: MUTED },
  navSave:   { fontSize: 17, color: BLUE, fontWeight: "600", textAlign: "right" },

  // Section header / footer
  groupHeader: {
    fontSize: 12, fontWeight: "400",
    color: MUTED, letterSpacing: 0.4,
    textTransform: "uppercase",
    marginLeft: 20, marginBottom: 6, marginTop: 22,
  },
  groupFooter: {
    fontSize: 12, color: MUTED,
    marginLeft: 20, marginRight: 20,
    marginTop: 6, lineHeight: 16,
  },

  // White grouped card
  group: {
    backgroundColor: WHITE,
    marginHorizontal: 16,
    borderRadius: 10,
    overflow: "hidden",
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 13,
    backgroundColor: WHITE,
    minHeight: 44,
  },
  rowPressed: { backgroundColor: "#e9e9eb" },
  rowLeft: { flex: 1, gap: 2 },
  rowLabel:  { fontSize: 16, color: INK },
  rowDetail: { fontSize: 12, color: MUTED },

  // Checkmark
  checkmark: {
    fontSize: 17, color: BLUE, fontWeight: "600", marginLeft: 8,
  },

  // Separator inside group
  sep: {
    position: "absolute",
    bottom: 0, left: 16, right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: SEP,
  },

  // Calorie input
  calInput: {
    flex: 1,
    fontSize: 16, color: INK,
    textAlign: "right",
    paddingVertical: 0,
  },
});
