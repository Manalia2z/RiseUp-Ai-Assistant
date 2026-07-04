import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/src/api/client";
import { Button } from "@/src/components/Button";
import { colors, radii } from "@/src/theme";

type Alarm = { id: string; label: string; time: string; verification: string };

const SENTENCES = [
  "I am the architect of my life today.",
  "Every small step matters. Let's go.",
  "Discipline equals freedom.",
  "Today I choose growth over comfort.",
  "I am becoming who I want to be.",
];

export default function AlarmVerify() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      const all: any[] = await api.listAlarms();
      const a = all.find((x) => x.id === id) || null;
      setAlarm(a);
    })();
  }, [id]);

  const complete = async () => {
    if (!alarm) return;
    await api.verifyAlarm(alarm.id, {});
    setSuccess(true);
    setTimeout(() => router.back(), 1500);
  };

  if (!alarm) {
    return (
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <Text style={styles.title}>Loading alarm…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <LinearGradient colors={["#FF5E0022", "#0A0A0A"]} style={styles.header}>
        <Ionicons name="alarm" size={40} color={colors.primary} />
        <Text style={styles.headerTitle}>{alarm.label}</Text>
        <Text style={styles.headerTime}>{alarm.time}</Text>
        <Text style={styles.headerSub}>Complete the challenge to stop the alarm.</Text>
      </LinearGradient>

      <View style={styles.body}>
        {success ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={60} color={colors.success} />
            <Text style={styles.successText}>You're awake! +25 XP</Text>
          </View>
        ) : alarm.verification === "math" ? (
          <MathChallenge onSolved={complete} />
        ) : alarm.verification === "typing" ? (
          <TypingChallenge onSolved={complete} />
        ) : alarm.verification === "memory" ? (
          <MemoryChallenge onSolved={complete} />
        ) : (
          <SentenceChallenge onSolved={complete} />
        )}
      </View>
    </SafeAreaView>
  );
}

function MathChallenge({ onSolved }: { onSolved: () => void }) {
  const problem = useMemo(() => {
    const a = 10 + Math.floor(Math.random() * 40);
    const b = 5 + Math.floor(Math.random() * 30);
    const op = Math.random() > 0.5 ? "+" : "-";
    const answer = op === "+" ? a + b : a - b;
    return { text: `${a} ${op} ${b}`, answer };
  }, []);
  const [val, setVal] = useState("");
  const [err, setErr] = useState(false);

  const check = () => {
    if (parseInt(val) === problem.answer) onSolved();
    else {
      setErr(true);
      setVal("");
      setTimeout(() => setErr(false), 800);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Solve to dismiss</Text>
      <Text style={styles.problem}>{problem.text} = ?</Text>
      <TextInput
        testID="alarm-math-input"
        style={[styles.input, err && { borderColor: colors.danger }]}
        keyboardType="numeric"
        value={val}
        onChangeText={setVal}
        placeholder="Your answer"
        placeholderTextColor={colors.textMuted}
        autoFocus
      />
      <View style={{ height: 12 }} />
      <Button testID="alarm-math-submit" title="Verify" onPress={check} disabled={!val} />
    </View>
  );
}

function TypingChallenge({ onSolved }: { onSolved: () => void }) {
  const sentence = useMemo(() => SENTENCES[Math.floor(Math.random() * SENTENCES.length)], []);
  const [val, setVal] = useState("");
  const match = val.trim() === sentence;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Type this exactly</Text>
      <Text style={styles.problem}>"{sentence}"</Text>
      <TextInput
        testID="alarm-typing-input"
        style={styles.input}
        value={val}
        onChangeText={setVal}
        placeholder="Type here..."
        placeholderTextColor={colors.textMuted}
        autoFocus
        multiline
      />
      <View style={{ height: 12 }} />
      <Button testID="alarm-typing-submit" title="Verify" onPress={onSolved} disabled={!match} />
    </View>
  );
}

function MemoryChallenge({ onSolved }: { onSolved: () => void }) {
  const sequence = useMemo(() => {
    const nums: number[] = [];
    for (let i = 0; i < 5; i++) nums.push(Math.floor(Math.random() * 9) + 1);
    return nums;
  }, []);
  const [showing, setShowing] = useState(true);
  const [val, setVal] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setShowing(false), 3500);
    return () => clearTimeout(t);
  }, []);

  const check = () => {
    if (val === sequence.join("")) onSolved();
    else setVal("");
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Memorize this sequence</Text>
      {showing ? (
        <Text style={[styles.problem, { letterSpacing: 8 }]}>{sequence.join(" ")}</Text>
      ) : (
        <>
          <Text style={styles.problem}>Type it now</Text>
          <TextInput
            testID="alarm-memory-input"
            style={styles.input}
            value={val}
            onChangeText={setVal}
            keyboardType="numeric"
            maxLength={sequence.length}
            placeholder="12345"
            placeholderTextColor={colors.textMuted}
            autoFocus
          />
          <View style={{ height: 12 }} />
          <Button testID="alarm-memory-submit" title="Verify" onPress={check} disabled={val.length < sequence.length} />
        </>
      )}
    </View>
  );
}

function SentenceChallenge({ onSolved }: { onSolved: () => void }) {
  const sentence = useMemo(() => SENTENCES[Math.floor(Math.random() * SENTENCES.length)], []);
  const [confirm, setConfirm] = useState(false);
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Read this out loud, then confirm</Text>
      <Text style={styles.problem}>"{sentence}"</Text>
      <Pressable testID="alarm-sentence-toggle" onPress={() => setConfirm(!confirm)} style={styles.checkbox}>
        <View style={[styles.checkboxBox, confirm && styles.checkboxOn]}>
          {confirm && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
        <Text style={styles.checkboxLabel}>I read it out loud</Text>
      </Pressable>
      <View style={{ height: 12 }} />
      <Button testID="alarm-sentence-submit" title="Verify" onPress={onSolved} disabled={!confirm} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: "center", padding: 30 },
  title: { color: colors.text, padding: 20 },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 12 },
  headerTime: { color: colors.primary, fontSize: 48, fontWeight: "800", marginTop: 8, letterSpacing: -1 },
  headerSub: { color: colors.textSecondary, marginTop: 4, textAlign: "center" },
  body: { padding: 20, flex: 1 },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: 20, borderWidth: 1, borderColor: colors.border },
  label: { color: colors.textMuted, fontSize: 12, letterSpacing: 1, fontWeight: "700", textTransform: "uppercase" },
  problem: { color: colors.text, fontSize: 30, fontWeight: "800", textAlign: "center", marginVertical: 20 },
  input: { backgroundColor: colors.bgAlt, borderRadius: radii.lg, padding: 14, color: colors.text, borderWidth: 1, borderColor: colors.borderStrong, fontSize: 18, textAlign: "center", minHeight: 50 },
  checkbox: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  checkboxBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxLabel: { color: colors.text, fontWeight: "600" },
  successBox: { alignItems: "center", padding: 40 },
  successText: { color: colors.success, fontSize: 20, fontWeight: "800", marginTop: 12 },
});
