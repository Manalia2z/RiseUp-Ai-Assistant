import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "@/src/components/Input";
import { Button } from "@/src/components/Button";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";
import { colors, radii } from "@/src/theme";

const ROLES = [
  { key: "Student", icon: "school" },
  { key: "Software Engineer", icon: "code-slash" },
  { key: "Freelancer", icon: "briefcase" },
  { key: "Business Owner", icon: "business" },
  { key: "Doctor", icon: "medkit" },
  { key: "Designer", icon: "color-palette" },
  { key: "Homemaker", icon: "home" },
  { key: "Other", icon: "person" },
];

const PERSONALITIES = [
  "Best Friend",
  "Strict Coach",
  "Big Brother",
  "Big Sister",
  "Calm Therapist",
  "Military Discipline Coach",
  "Funny Friend",
  "Professional Mentor",
  "Motivator",
  "Teacher",
];

export default function Onboarding() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({
    role: "",
    age: "",
    wake_time: "07:00",
    sleep_time: "23:00",
    work_hours: "9-6",
    free_hours: "2",
    stress_level: 5,
    fitness_level: 5,
    current_habits: "",
    distractions: "",
    strengths: "",
    weaknesses: "",
    routine_style: "flexible",
    learning_style: "visual",
    ai_personality: "Best Friend",
  });

  const totalSteps = 6;

  const next = () => setStep((s) => Math.min(s + 1, totalSteps - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    setLoading(true);
    try {
      const payload = { ...data, age: data.age ? parseInt(data.age) : undefined };
      await api.saveOnboarding(payload);
      await refresh();
      router.replace("/(tabs)");
    } finally {
      setLoading(false);
    }
  };

  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        {step > 0 && (
          <Pressable onPress={prev} style={styles.backBtn} testID="onboarding-back">
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
        )}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{step + 1}/{totalSteps}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <>
              <Text style={styles.title}>Who are you?</Text>
              <Text style={styles.subtitle}>This helps me personalize your experience.</Text>
              <View style={styles.grid}>
                {ROLES.map((r) => (
                  <Pressable
                    key={r.key}
                    testID={`role-${r.key.toLowerCase().replace(/\s/g, "-")}`}
                    onPress={() => setData({ ...data, role: r.key })}
                    style={[styles.tile, data.role === r.key && styles.tileActive]}
                  >
                    <Ionicons name={r.icon as any} size={22} color={data.role === r.key ? colors.primary : colors.text} />
                    <Text style={[styles.tileText, data.role === r.key && { color: colors.primary }]}>{r.key}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.title}>Tell me about your day</Text>
              <Text style={styles.subtitle}>Rough times are fine.</Text>
              <Input label="Age" placeholder="e.g. 24" keyboardType="numeric" value={data.age} onChangeText={(v) => setData({ ...data, age: v })} testID="onboarding-age" />
              <Input label="Wake up time" placeholder="e.g. 07:00" value={data.wake_time} onChangeText={(v) => setData({ ...data, wake_time: v })} testID="onboarding-wake" />
              <Input label="Sleep time" placeholder="e.g. 23:00" value={data.sleep_time} onChangeText={(v) => setData({ ...data, sleep_time: v })} testID="onboarding-sleep" />
              <Input label="Work/College hours" placeholder="e.g. 9-6" value={data.work_hours} onChangeText={(v) => setData({ ...data, work_hours: v })} testID="onboarding-work" />
              <Input label="Free hours per day" placeholder="e.g. 2" value={data.free_hours} onChangeText={(v) => setData({ ...data, free_hours: v })} testID="onboarding-free" />
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.title}>How's your energy?</Text>
              <Text style={styles.subtitle}>1 = very low, 10 = amazing</Text>
              <Slider label="Stress level" value={data.stress_level} onChange={(v) => setData({ ...data, stress_level: v })} />
              <Slider label="Fitness level" value={data.fitness_level} onChange={(v) => setData({ ...data, fitness_level: v })} />
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.title}>Your inner world</Text>
              <Text style={styles.subtitle}>Be honest — this is between us.</Text>
              <Input label="Biggest distractions" placeholder="Social media, Netflix..." value={data.distractions} onChangeText={(v) => setData({ ...data, distractions: v })} testID="onboarding-distractions" />
              <Input label="Biggest strengths" placeholder="Discipline, creativity..." value={data.strengths} onChangeText={(v) => setData({ ...data, strengths: v })} testID="onboarding-strengths" />
              <Input label="Biggest weakness" placeholder="Procrastination..." value={data.weaknesses} onChangeText={(v) => setData({ ...data, weaknesses: v })} testID="onboarding-weakness" />
              <Input label="Current habits" placeholder="Gym, reading..." value={data.current_habits} onChangeText={(v) => setData({ ...data, current_habits: v })} testID="onboarding-habits" />
            </>
          )}

          {step === 4 && (
            <>
              <Text style={styles.title}>How do you prefer to grow?</Text>
              <Text style={styles.subtitle}>Choose what fits you best.</Text>
              <Text style={styles.section}>Routine style</Text>
              <View style={styles.row}>
                {["strict", "flexible"].map((s) => (
                  <Pressable key={s} testID={`onboarding-routine-${s}`} onPress={() => setData({ ...data, routine_style: s })} style={[styles.pill, data.routine_style === s && styles.pillActive]}>
                    <Text style={[styles.pillText, data.routine_style === s && { color: colors.primary }]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.section}>Learning style</Text>
              <View style={styles.row}>
                {["visual", "audio", "reading", "hands-on"].map((s) => (
                  <Pressable key={s} testID={`onboarding-learning-${s}`} onPress={() => setData({ ...data, learning_style: s })} style={[styles.pill, data.learning_style === s && styles.pillActive]}>
                    <Text style={[styles.pillText, data.learning_style === s && { color: colors.primary }]}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {step === 5 && (
            <>
              <Text style={styles.title}>Choose your AI personality</Text>
              <Text style={styles.subtitle}>You can change this anytime.</Text>
              <View style={{ marginTop: 12 }}>
                {PERSONALITIES.map((p) => (
                  <Pressable
                    key={p}
                    testID={`onboarding-persona-${p.toLowerCase().replace(/\s/g, "-")}`}
                    onPress={() => setData({ ...data, ai_personality: p })}
                    style={[styles.personaRow, data.ai_personality === p && styles.personaActive]}
                  >
                    <Text style={[styles.personaText, data.ai_personality === p && { color: colors.primary }]}>{p}</Text>
                    {data.ai_personality === p && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step < totalSteps - 1 ? (
            <Button
              testID="onboarding-next"
              title="Continue"
              onPress={next}
              disabled={step === 0 && !data.role}
            />
          ) : (
            <Button
              testID="onboarding-finish"
              title={loading ? "Setting up..." : "Start my journey"}
              onPress={finish}
              loading={loading}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
        <Text style={{ color: colors.text, fontWeight: "600" }}>{label}</Text>
        <Text style={{ color: colors.primary, fontWeight: "700" }}>{value}/10</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            testID={`slider-${label.replace(/\s/g, "-").toLowerCase()}-${n}`}
            style={{
              flex: 1,
              height: 36,
              borderRadius: 8,
              backgroundColor: n <= value ? colors.primary : colors.card,
              borderWidth: 1,
              borderColor: colors.borderStrong,
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  progressBar: { flex: 1, height: 6, backgroundColor: colors.card, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 3 },
  progressText: { color: colors.textSecondary, fontSize: 13, minWidth: 32, textAlign: "right" },
  scroll: { padding: 24, paddingBottom: 24 },
  title: { color: colors.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.6 },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 6, marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: {
    width: "47%",
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    gap: 8,
  },
  tileActive: { borderColor: colors.primary, backgroundColor: "rgba(255,94,0,0.10)" },
  tileText: { color: colors.text, fontWeight: "600" },
  section: { color: colors.textSecondary, fontSize: 13, fontWeight: "600", marginTop: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  pillActive: { borderColor: colors.primary, backgroundColor: "rgba(255,94,0,0.12)" },
  pillText: { color: colors.text, fontWeight: "600", textTransform: "capitalize" },
  personaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginBottom: 10,
  },
  personaActive: { borderColor: colors.primary, backgroundColor: "rgba(255,94,0,0.10)" },
  personaText: { color: colors.text, fontWeight: "700", fontSize: 15 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg },
});
