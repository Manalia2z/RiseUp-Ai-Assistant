import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "@/src/api/client";
import { Button } from "@/src/components/Button";
import { colors, radii } from "@/src/theme";

export default function GoalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [goal, setGoal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const g = await api.getGoal(id);
      setGoal(g);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const generate = async () => {
    setGenerating(true);
    try {
      await api.generatePlan(id!);
      await load();
    } finally {
      setGenerating(false);
    }
  };

  const remove = async () => {
    await api.deleteGoal(id!);
    router.back();
  };

  if (loading || !goal) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  const plan = goal.plan;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="goal-back">
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Pressable onPress={remove} style={styles.deleteBtn} testID="goal-delete">
            <Ionicons name="trash" size={18} color={colors.danger} />
          </Pressable>
        </View>

        <LinearGradient colors={["#FF5E00", "#F43F5E"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.hero}>
          <Ionicons name="trophy" size={32} color="#fff" />
          <Text style={styles.heroTitle}>{goal.title}</Text>
          <Text style={styles.heroMeta}>{goal.category} • {goal.deadline_days} days</Text>
          {goal.description ? <Text style={styles.heroDesc}>{goal.description}</Text> : null}
        </LinearGradient>

        {!plan ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Let AI build your plan</Text>
            <Text style={styles.cardText}>
              I'll create a personalized daily & weekly plan for this goal based on your profile.
            </Text>
            <View style={{ height: 12 }} />
            <Button testID="goal-generate-plan" title={generating ? "Building your plan..." : "Generate my plan ✨"} onPress={generate} loading={generating} />
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.section}>SUMMARY</Text>
              <Text style={styles.text}>{plan.summary}</Text>
            </View>

            {plan.milestones?.length ? (
              <View style={styles.card}>
                <Text style={styles.section}>MILESTONES</Text>
                {plan.milestones.map((m: string, i: number) => (
                  <View key={i} style={styles.row}>
                    <View style={styles.dot}><Text style={styles.dotText}>{i + 1}</Text></View>
                    <Text style={styles.text}>{m}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {plan.daily_tasks?.length ? (
              <View style={styles.card}>
                <Text style={styles.section}>DAILY TASKS</Text>
                {plan.daily_tasks.map((t: any, i: number) => (
                  <View key={i} style={styles.taskRow}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.taskTitle}>{t.title}</Text>
                      <Text style={styles.taskMeta}>{t.time_of_day} • +{t.xp} XP</Text>
                    </View>
                  </View>
                ))}
                <Text style={styles.hint}>These have been added to today's tasks 🎉</Text>
              </View>
            ) : null}

            {plan.weekly_tasks?.length ? (
              <View style={styles.card}>
                <Text style={styles.section}>WEEKLY TASKS</Text>
                {plan.weekly_tasks.map((t: any, i: number) => (
                  <View key={i} style={styles.taskRow}>
                    <Ionicons name="calendar-outline" size={20} color={colors.accent} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.taskTitle}>{t.title}</Text>
                      <Text style={styles.taskMeta}>{t.day} • +{t.xp} XP</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {plan.tips?.length ? (
              <View style={styles.card}>
                <Text style={styles.section}>COACH TIPS</Text>
                {plan.tips.map((t: string, i: number) => (
                  <View key={i} style={styles.row}>
                    <Ionicons name="bulb" size={18} color={colors.warning} />
                    <Text style={styles.text}>{t}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={{ height: 8 }} />
            <Button testID="goal-regenerate-plan" title={generating ? "Regenerating..." : "Regenerate plan"} variant="secondary" onPress={generate} loading={generating} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  deleteBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  hero: { borderRadius: radii.xl, padding: 24, marginBottom: 16 },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 12, letterSpacing: -0.4 },
  heroMeta: { color: "rgba(255,255,255,0.85)", marginTop: 4, fontWeight: "600" },
  heroDesc: { color: "rgba(255,255,255,0.9)", marginTop: 10, lineHeight: 20 },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "800", marginBottom: 6 },
  cardText: { color: colors.textSecondary, lineHeight: 20 },
  section: { color: colors.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginBottom: 10 },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 10 },
  dot: { width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(255,94,0,0.15)", alignItems: "center", justifyContent: "center" },
  dotText: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  text: { color: colors.text, flex: 1, lineHeight: 20 },
  taskRow: { flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 10 },
  taskTitle: { color: colors.text, fontWeight: "600" },
  taskMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  hint: { color: colors.success, fontSize: 12, marginTop: 6, fontStyle: "italic" },
});
