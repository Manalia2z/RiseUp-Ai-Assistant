import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "@/src/api/client";
import { Button } from "@/src/components/Button";
import { colors, radii } from "@/src/theme";

const MOODS = [
  { key: "great", label: "Great", emoji: "😄", color: "#10B981" },
  { key: "good", label: "Good", emoji: "🙂", color: "#3B82F6" },
  { key: "okay", label: "Okay", emoji: "😐", color: "#F59E0B" },
  { key: "low", label: "Low", emoji: "😔", color: "#8B5CF6" },
  { key: "bad", label: "Bad", emoji: "😢", color: "#EF4444" },
];

const AFFIRMATIONS = [
  "I am becoming the person I want to be.",
  "Small steps every day lead to big changes.",
  "I am stronger than my excuses.",
  "Progress, not perfection.",
  "I choose growth over comfort.",
];

export default function Wellness() {
  const router = useRouter();
  const [journals, setJournals] = useState<any[]>([]);
  const [moods, setMoods] = useState<any[]>([]);
  const [newEntry, setNewEntry] = useState("");
  const [entryKind, setEntryKind] = useState<"journal" | "gratitude" | "reflection">("journal");
  const [breathing, setBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"in" | "hold" | "out">("in");

  const load = useCallback(async () => {
    try {
      const [j, m] = await Promise.all([api.listJournal(), api.listMood()]);
      setJournals(j);
      setMoods(m);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const logMood = async (moodKey: string) => {
    await api.logMood({ mood: moodKey, energy: 5, stress: 5, sleep_quality: 5 });
    await load();
  };

  const saveEntry = async () => {
    if (!newEntry.trim()) return;
    await api.createJournal({ kind: entryKind, text: newEntry.trim() });
    setNewEntry("");
    await load();
  };

  const startBreathing = () => {
    setBreathing(true);
    let cycle = 0;
    const cycles = 5;
    const step = () => {
      setBreathPhase("in");
      setTimeout(() => setBreathPhase("hold"), 4000);
      setTimeout(() => setBreathPhase("out"), 6000);
      setTimeout(() => {
        cycle += 1;
        if (cycle < cycles) step();
        else setBreathing(false);
      }, 10000);
    };
    step();
  };

  const todayAffirm = AFFIRMATIONS[new Date().getDate() % AFFIRMATIONS.length];

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={styles.title}>Wellness</Text>
        <Text style={styles.sub}>Feel, reflect, breathe.</Text>

        {/* Mood check-in */}
        <View style={styles.card}>
          <Text style={styles.section}>HOW DO YOU FEEL?</Text>
          <View style={styles.moodRow}>
            {MOODS.map((m) => (
              <Pressable key={m.key} testID={`mood-${m.key}`} onPress={() => logMood(m.key)} style={styles.moodPill}>
                <Text style={{ fontSize: 26 }}>{m.emoji}</Text>
                <Text style={styles.moodLabel}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Affirmation */}
        <LinearGradient colors={["#8B5CF622", "#EC489922"]} style={styles.affirmCard}>
          <Text style={styles.section}>DAILY AFFIRMATION</Text>
          <Text style={styles.affirmText}>"{todayAffirm}"</Text>
        </LinearGradient>

        {/* Breathing */}
        <View style={styles.card}>
          <Text style={styles.section}>BREATHING EXERCISE (4-2-4)</Text>
          {breathing ? (
            <View style={styles.breathBox}>
              <View style={[styles.breathCircle, breathPhase === "in" && styles.breathIn, breathPhase === "hold" && styles.breathHold, breathPhase === "out" && styles.breathOut]}>
                <Text style={styles.breathText}>
                  {breathPhase === "in" ? "Breathe in" : breathPhase === "hold" ? "Hold" : "Breathe out"}
                </Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.text}>2 minutes of calm. Follow the circle.</Text>
              <View style={{ height: 12 }} />
              <Button testID="wellness-start-breathing" title="Start breathing" onPress={startBreathing} />
            </>
          )}
        </View>

        {/* Emergency calm */}
        <Pressable onPress={startBreathing} style={styles.emergency} testID="wellness-emergency-calm">
          <LinearGradient colors={["#3B82F6", "#8B5CF6"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.emergencyGrad}>
            <Ionicons name="water" size={22} color="#fff" />
            <View>
              <Text style={styles.emergencyTitle}>Emergency Calm Mode</Text>
              <Text style={styles.emergencySub}>Tap for immediate relief</Text>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Journal */}
        <View style={styles.card}>
          <Text style={styles.section}>JOURNAL & GRATITUDE</Text>
          <View style={styles.tabRow}>
            {(["journal", "gratitude", "reflection"] as const).map((k) => (
              <Pressable key={k} testID={`journal-tab-${k}`} onPress={() => setEntryKind(k)} style={[styles.tab, entryKind === k && styles.tabActive]}>
                <Text style={[styles.tabText, entryKind === k && { color: colors.primary }]}>{k}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            testID="journal-input"
            style={styles.textarea}
            placeholder={entryKind === "gratitude" ? "What are you grateful for today?" : entryKind === "reflection" ? "Reflect on your day..." : "Write your thoughts..."}
            placeholderTextColor={colors.textMuted}
            value={newEntry}
            onChangeText={setNewEntry}
            multiline
          />
          <View style={{ height: 8 }} />
          <Button testID="journal-save" title="Save entry" onPress={saveEntry} disabled={!newEntry.trim()} />
        </View>

        {/* Recent entries */}
        {journals.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.section}>RECENT ENTRIES</Text>
            {journals.slice(0, 5).map((j) => (
              <View key={j.id} style={styles.entry}>
                <Text style={styles.entryKind}>{j.kind} • {new Date(j.created_at).toLocaleDateString()}</Text>
                <Text style={styles.entryText} numberOfLines={3}>{j.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Mood history */}
        {moods.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.section}>MOOD HISTORY</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {moods.slice(0, 14).map((m) => {
                const mm = MOODS.find((x) => x.key === m.mood);
                return (
                  <View key={m.id} style={styles.moodDot}>
                    <Text style={{ fontSize: 18 }}>{mm?.emoji || "🙂"}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 26, fontWeight: "800" },
  sub: { color: colors.textSecondary, marginTop: 4, marginBottom: 20 },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  section: { color: colors.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 12 },
  text: { color: colors.textSecondary, lineHeight: 20 },
  moodRow: { flexDirection: "row", justifyContent: "space-between" },
  moodPill: { alignItems: "center", gap: 4, flex: 1 },
  moodLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: "600" },
  affirmCard: { borderRadius: radii.xl, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  affirmText: { color: colors.text, fontSize: 18, fontWeight: "700", lineHeight: 26, fontStyle: "italic" },
  breathBox: { alignItems: "center", padding: 20 },
  breathCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(59,130,246,0.2)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.accent },
  breathIn: { transform: [{ scale: 1.15 }] },
  breathHold: { transform: [{ scale: 1.15 }], backgroundColor: "rgba(139,92,246,0.2)", borderColor: colors.purple },
  breathOut: { transform: [{ scale: 1 }] },
  breathText: { color: colors.text, fontSize: 16, fontWeight: "700" },
  emergency: { borderRadius: radii.xl, overflow: "hidden", marginBottom: 12 },
  emergencyGrad: { padding: 18, flexDirection: "row", alignItems: "center", gap: 12 },
  emergencyTitle: { color: "#fff", fontWeight: "800", fontSize: 15 },
  emergencySub: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.full, backgroundColor: colors.bgAlt, borderWidth: 1, borderColor: colors.borderStrong },
  tabActive: { borderColor: colors.primary, backgroundColor: "rgba(255,94,0,0.12)" },
  tabText: { color: colors.text, fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  textarea: { backgroundColor: colors.bgAlt, borderRadius: radii.lg, padding: 14, color: colors.text, minHeight: 90, borderWidth: 1, borderColor: colors.borderStrong, textAlignVertical: "top" },
  entry: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  entryKind: { color: colors.primary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  entryText: { color: colors.text, marginTop: 4, lineHeight: 20, fontSize: 14 },
  moodDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgAlt, alignItems: "center", justifyContent: "center" },
});
