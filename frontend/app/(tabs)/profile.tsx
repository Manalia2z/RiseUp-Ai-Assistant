import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";
import { Button } from "@/src/components/Button";
import { colors, radii } from "@/src/theme";

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

export default function Profile() {
  const router = useRouter();
  const { user, logout, refresh } = useAuth();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await api.weeklyReport();
      setReport(r);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const changePersonality = async (p: string) => {
    await api.setPersonality(p);
    await refresh();
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={styles.title}>Profile</Text>

        {/* User card */}
        <LinearGradient colors={["#141414", "#1F1F1F"]} style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{(user?.name || "R").charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.badgesRow}>
            <Badge label={`Level ${user?.level}`} color={colors.primary} />
            <Badge label={`${user?.xp} XP`} color={colors.accent} />
            <Badge label={`🔥 ${user?.streak}`} color={colors.warning} />
          </View>
        </LinearGradient>

        {/* Weekly report */}
        <View style={styles.card}>
          <Text style={styles.section}>THIS WEEK</Text>
          {loading || !report ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View style={styles.reportGrid}>
              <ReportBox label="Tasks done" value={`${report.completed_tasks}/${report.total_tasks}`} />
              <ReportBox label="Completion" value={`${report.completion_rate}%`} />
              <ReportBox label="Avg energy" value={`${report.avg_energy}/10`} />
              <ReportBox label="Streak" value={`${report.streak}d`} />
            </View>
          )}
        </View>

        {/* AI Personality */}
        <View style={styles.card}>
          <Text style={styles.section}>AI PERSONALITY</Text>
          <Text style={styles.hint}>Currently: {user?.ai_personality}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.persoRow}>
            {PERSONALITIES.map((p) => (
              <Pressable
                key={p}
                testID={`persona-${p.toLowerCase().replace(/\s/g,'-')}`}
                onPress={() => changePersonality(p)}
                style={[styles.persoChip, user?.ai_personality === p && styles.persoChipActive]}
              >
                <Text style={[styles.persoText, user?.ai_personality === p && { color: colors.primary }]}>{p}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Sections */}
        <View style={styles.card}>
          <Row icon="alarm" label="Smart Alarms" onPress={() => router.push("/alarms")} testID="profile-alarms" />
          <Row icon="rocket" label="My Goals" onPress={() => router.push("/(tabs)/goals")} testID="profile-goals" />
          <Row icon="heart" label="Wellness" onPress={() => router.push("/(tabs)/wellness")} testID="profile-wellness" />
          <Row icon="log-out" label="Logout" onPress={logout} testID="profile-logout" danger last />
        </View>

        {/* Manali footer */}
        <Pressable
          testID="profile-manali-link"
          onPress={() => Linking.openURL("https://manalitech.com")}
          style={styles.footer}
        >
          <Text style={styles.footerText}>Crafted with ❤️ by</Text>
          <Image
            source={{ uri: "https://customer-assets.emergentagent.com/job_7d159709-333f-4945-b3c6-e2ec9dd90a7e/artifacts/5bk4g0l7_Manalilogo.jpg" }}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <Text style={styles.footerLink}>manalitech.com</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function ReportBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reportBox}>
      <Text style={styles.reportValue}>{value}</Text>
      <Text style={styles.reportLabel}>{label}</Text>
    </View>
  );
}

function Row({ icon, label, onPress, testID, danger, last }: { icon: any; label: string; onPress: () => void; testID?: string; danger?: boolean; last?: boolean }) {
  return (
    <Pressable testID={testID} onPress={onPress} style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.text} />
      <Text style={[styles.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 26, fontWeight: "800", marginBottom: 16 },
  userCard: { alignItems: "center", padding: 24, borderRadius: radii.xl, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 74, height: 74, borderRadius: 37, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: "#fff", fontSize: 30, fontWeight: "800" },
  userName: { color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 10 },
  userEmail: { color: colors.textSecondary, marginTop: 2, fontSize: 13 },
  badgesRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.full, borderWidth: 1 },
  badgeText: { fontWeight: "700", fontSize: 12 },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  section: { color: colors.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 10 },
  hint: { color: colors.textSecondary, fontSize: 13, marginBottom: 12 },
  reportGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  reportBox: { width: "47%", padding: 12, backgroundColor: colors.bgAlt, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderStrong },
  reportValue: { color: colors.text, fontSize: 20, fontWeight: "800" },
  reportLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  persoRow: { gap: 8, paddingRight: 20 },
  persoChip: { height: 36, paddingHorizontal: 14, borderRadius: radii.full, backgroundColor: colors.bgAlt, borderWidth: 1, borderColor: colors.borderStrong, justifyContent: "center", flexShrink: 0 },
  persoChipActive: { borderColor: colors.primary, backgroundColor: "rgba(255,94,0,0.12)" },
  persoText: { color: colors.text, fontSize: 12, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
  rowLabel: { color: colors.text, fontSize: 15, fontWeight: "600", flex: 1 },
  footer: { alignItems: "center", padding: 20, marginTop: 8 },
  footerText: { color: colors.textMuted, fontSize: 12 },
  footerLogo: { width: 60, height: 60, marginTop: 6, backgroundColor: "#fff", borderRadius: 12, padding: 4 },
  footerLink: { color: colors.primary, fontWeight: "700", fontSize: 12, marginTop: 4 },
});
