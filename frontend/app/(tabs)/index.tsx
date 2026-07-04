import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";
import { Card } from "@/src/components/Card";
import { colors, radii } from "@/src/theme";

export default function Home() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api.dashboard();
      setData(d);
      await refresh();
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggleTask = async (id: string, completed: boolean) => {
    await api.updateTask(id, { completed: !completed });
    await load();
  };

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{user?.name || "Friend"} 👋</Text>
          </View>
          <Pressable
            testID="home-notif-btn"
            onPress={() => router.push("/(tabs)/wellness")}
            style={styles.iconBtn}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
          </Pressable>
        </View>

        {/* Hero streak card */}
        <View style={styles.hero}>
          <LinearGradient
            colors={["#FF5E00", "#F43F5E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGrad}
          >
            <View>
              <Text style={styles.heroLabel}>YOUR STREAK</Text>
              <Text style={styles.heroValue}>{data.streak} days 🔥</Text>
              <Text style={styles.heroSub}>Level {data.level} • {data.xp} XP</Text>
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="flash" size={28} color="#fff" />
            </View>
          </LinearGradient>
        </View>

        {/* Bento stats */}
        <View style={styles.bento}>
          <StatCard
            title="Productivity"
            value={`${data.productivity}%`}
            icon="trending-up"
            accent={colors.success}
          />
          <StatCard
            title="Coins"
            value={data.coins}
            icon="diamond"
            accent={colors.accent}
          />
          <StatCard
            title="Tasks"
            value={`${data.completed_count}/${data.total_count}`}
            icon="checkmark-done"
            accent={colors.primary}
          />
          <StatCard
            title="Goals"
            value={data.active_goals}
            icon="rocket"
            accent={colors.purple}
          />
        </View>

        {/* Today's Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's tasks</Text>
            <Pressable testID="home-add-task" onPress={() => router.push("/goals")}>
              <Text style={styles.sectionLink}>Add</Text>
            </Pressable>
          </View>
          {data.today_tasks.length === 0 ? (
            <Card>
              <Text style={styles.emptyTitle}>No tasks yet</Text>
              <Text style={styles.emptyText}>Create a goal and let AI plan your day.</Text>
              <Pressable
                testID="home-create-first-goal"
                onPress={() => router.push("/(tabs)/goals")}
                style={styles.emptyBtn}
              >
                <Text style={{ color: colors.primary, fontWeight: "700" }}>Create your first goal →</Text>
              </Pressable>
            </Card>
          ) : (
            data.today_tasks.map((t: any) => (
              <Pressable
                key={t.id}
                testID={`task-item-${t.id}`}
                onPress={() => toggleTask(t.id, t.completed)}
                style={styles.taskRow}
              >
                <View style={[styles.checkbox, t.completed && styles.checkboxDone]}>
                  {t.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskTitle, t.completed && styles.taskDone]}>{t.title}</Text>
                  <Text style={styles.taskMeta}>{t.time_of_day} • +{t.xp} XP</Text>
                </View>
              </Pressable>
            ))
          )}
        </View>

        {/* Active Goals */}
        {data.goals && data.goals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active goals</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 24 }}>
              {data.goals.map((g: any) => (
                <Pressable
                  key={g.id}
                  testID={`goal-card-${g.id}`}
                  onPress={() => router.push(`/goal/${g.id}`)}
                  style={styles.goalCard}
                >
                  <Ionicons name="trophy" size={20} color={colors.primary} />
                  <Text style={styles.goalTitle} numberOfLines={2}>{g.title}</Text>
                  <Text style={styles.goalMeta}>{g.category} • {g.deadline_days}d</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.quickGrid}>
            <QuickAction icon="chatbubbles" label="Talk to Coach" onPress={() => router.push("/(tabs)/chat")} testID="quick-chat" />
            <QuickAction icon="heart" label="Log Mood" onPress={() => router.push("/(tabs)/wellness")} testID="quick-mood" />
            <QuickAction icon="alarm" label="Smart Alarm" onPress={() => router.push("/alarms")} testID="quick-alarm" />
            <QuickAction icon="book" label="Journal" onPress={() => router.push("/(tabs)/wellness")} testID="quick-journal" />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ title, value, icon, accent }: { title: string; value: any; icon: any; accent: string }) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: `${accent}22` }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress, testID }: { icon: any; label: string; onPress: () => void; testID?: string }) {
  return (
    <Pressable testID={testID} onPress={onPress} style={styles.quickAction}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  greeting: { color: colors.textSecondary, fontSize: 14 },
  name: { color: colors.text, fontSize: 24, fontWeight: "800", marginTop: 2 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  hero: { borderRadius: radii.xl, overflow: "hidden", marginBottom: 16 },
  heroGrad: { padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: radii.xl },
  heroLabel: { color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  heroValue: { color: "#fff", fontSize: 30, fontWeight: "800", marginTop: 4 },
  heroSub: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 4, fontWeight: "600" },
  heroBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bento: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  stat: {
    width: "47.5%",
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statValue: { color: colors.text, fontSize: 22, fontWeight: "800" },
  statTitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2, fontWeight: "600" },
  section: { marginTop: 8, marginBottom: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  sectionLink: { color: colors.primary, fontWeight: "700" },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 6 },
  emptyText: { color: colors.textSecondary, fontSize: 13 },
  emptyBtn: { marginTop: 12 },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  taskTitle: { color: colors.text, fontWeight: "600", fontSize: 14 },
  taskDone: { textDecorationLine: "line-through", color: colors.textMuted },
  taskMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  goalCard: {
    width: 180,
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  goalTitle: { color: colors.text, fontWeight: "700", fontSize: 15 },
  goalMeta: { color: colors.textMuted, fontSize: 12 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickAction: {
    width: "47.5%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickLabel: { color: colors.text, fontWeight: "600", fontSize: 13 },
});
