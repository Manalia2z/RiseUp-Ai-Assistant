import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "@/src/api/client";
import { Button } from "@/src/components/Button";
import { Input } from "@/src/components/Input";
import { colors, radii } from "@/src/theme";

const CATEGORIES = [
  { key: "health", label: "Health", icon: "fitness" },
  { key: "career", label: "Career", icon: "briefcase" },
  { key: "learning", label: "Learning", icon: "book" },
  { key: "mindset", label: "Mindset", icon: "leaf" },
  { key: "finance", label: "Finance", icon: "cash" },
  { key: "custom", label: "Custom", icon: "star" },
];

const SUGGESTIONS: Record<string, string[]> = {
  health: ["Lose 5 kg in 60 days", "Build a workout habit", "Sleep 8 hours daily", "Drink 3L water"],
  career: ["Get promoted this year", "Build my portfolio", "Land a new job", "Start freelancing"],
  learning: ["Learn Python in 30 days", "Read 12 books this year", "Master public speaking", "Learn a new language"],
  mindset: ["Meditate 10 min daily", "Stop procrastination", "Improve confidence", "Practice gratitude"],
  finance: ["Save $5000 in 6 months", "Track daily expenses", "Invest 10% monthly", "Pay off debt"],
  custom: [],
};

export default function GoalsTab() {
  const router = useRouter();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [category, setCategory] = useState("health");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("30");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await api.listGoals();
      setGoals(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const createGoal = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const g: any = await api.createGoal({
        title: title.trim(),
        category,
        description: description.trim(),
        deadline_days: parseInt(deadline) || 30,
      });
      setShowCreate(false);
      setTitle("");
      setDescription("");
      await load();
      router.push(`/goal/${g.id}`);
    } catch (e: any) {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Goals</Text>
        <Pressable testID="goals-create-btn" onPress={() => setShowCreate(true)} style={styles.addBtn}>
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : goals.length === 0 ? (
        <ScrollView contentContainerStyle={styles.empty}>
          <LinearGradient
            colors={["#FF5E0022", "#F43F5E22"]}
            style={styles.emptyBadge}
          >
            <Ionicons name="rocket" size={40} color={colors.primary} />
          </LinearGradient>
          <Text style={styles.emptyTitle}>No goals yet</Text>
          <Text style={styles.emptyText}>
            Tell me what you want to achieve and I'll build a personalized plan for you.
          </Text>
          <View style={{ height: 20 }} />
          <Button testID="goals-empty-create" title="Create your first goal" onPress={() => setShowCreate(true)} />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {goals.map((g) => (
            <Pressable
              key={g.id}
              testID={`goals-list-item-${g.id}`}
              onPress={() => router.push(`/goal/${g.id}`)}
              style={styles.goalItem}
            >
              <View style={styles.goalIcon}>
                <Ionicons
                  name={(CATEGORIES.find((c) => c.key === g.category)?.icon as any) || "star"}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.goalTitle} numberOfLines={2}>{g.title}</Text>
                <Text style={styles.goalMeta}>
                  {g.category} • {g.deadline_days} days • {g.plan ? "Plan ready" : "Tap to plan"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </ScrollView>
      )}

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "flex-end" }}>
            <View style={styles.modal}>
              <View style={styles.modalHandle} />
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={styles.modalTitle}>Create a Goal</Text>
                <Text style={styles.modalSub}>Pick a category</Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
                  {CATEGORIES.map((c) => (
                    <Pressable
                      key={c.key}
                      testID={`goal-category-${c.key}`}
                      onPress={() => setCategory(c.key)}
                      style={[styles.catChip, category === c.key && styles.catChipActive]}
                    >
                      <Ionicons name={c.icon as any} size={14} color={category === c.key ? colors.primary : colors.text} />
                      <Text style={[styles.catText, category === c.key && { color: colors.primary }]}>{c.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <View style={{ marginTop: 20 }}>
                  <Input
                    testID="goal-title-input"
                    label="What's the goal?"
                    placeholder="e.g. Learn Python in 30 days"
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                {SUGGESTIONS[category].length > 0 && !title && (
                  <View>
                    <Text style={styles.suggestLabel}>Suggestions</Text>
                    {SUGGESTIONS[category].map((s) => (
                      <Pressable key={s} onPress={() => setTitle(s)} style={styles.suggest} testID={`goal-suggest-${s.slice(0, 10).replace(/\s/g, "-")}`}>
                        <Ionicons name="sparkles" size={14} color={colors.primary} />
                        <Text style={styles.suggestText}>{s}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                <Input
                  testID="goal-desc-input"
                  label="Why this goal?"
                  placeholder="Your motivation, context..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
                <Input
                  testID="goal-deadline-input"
                  label="Deadline (days)"
                  placeholder="30"
                  value={deadline}
                  onChangeText={setDeadline}
                  keyboardType="numeric"
                />
                <View style={{ height: 12 }} />
                <Button testID="goal-create-submit" title={creating ? "Creating..." : "Create & plan with AI"} loading={creating} onPress={createGoal} disabled={!title.trim()} />
                <View style={{ height: 10 }} />
                <Button testID="goal-create-cancel" title="Cancel" variant="secondary" onPress={() => setShowCreate(false)} />
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { color: colors.text, fontSize: 26, fontWeight: "800" },
  addBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  empty: { padding: 24, alignItems: "center", flexGrow: 1, justifyContent: "center" },
  emptyBadge: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 4 },
  emptyText: { color: colors.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 20, maxWidth: 300 },
  goalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  goalIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,94,0,0.12)", alignItems: "center", justifyContent: "center" },
  goalTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  goalMeta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay },
  modal: { backgroundColor: colors.bgAlt, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: "88%" },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.borderStrong, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: "800" },
  modalSub: { color: colors.textSecondary, marginTop: 4, marginBottom: 12 },
  categoriesRow: { gap: 8, paddingRight: 20 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    flexShrink: 0,
  },
  catChipActive: { borderColor: colors.primary, backgroundColor: "rgba(255,94,0,0.12)" },
  catText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  suggestLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "700", letterSpacing: 0.6, marginBottom: 8, textTransform: "uppercase" },
  suggest: { flexDirection: "row", gap: 8, alignItems: "center", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.card, marginBottom: 6 },
  suggestText: { color: colors.text, fontSize: 13 },
});
