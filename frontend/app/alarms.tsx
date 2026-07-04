import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "@/src/api/client";
import { Button } from "@/src/components/Button";
import { Input } from "@/src/components/Input";
import { colors, radii } from "@/src/theme";

const VERIFICATIONS = [
  { key: "math", label: "Math puzzle", icon: "calculator" },
  { key: "typing", label: "Typing challenge", icon: "keypad" },
  { key: "memory", label: "Memory game", icon: "sparkles" },
  { key: "sentence", label: "Read a sentence", icon: "chatbox" },
];

export default function Alarms() {
  const router = useRouter();
  const [alarms, setAlarms] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("07:00");
  const [verification, setVerification] = useState("math");

  const load = useCallback(async () => {
    const list = await api.listAlarms();
    setAlarms(list);
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const create = async () => {
    if (!label.trim()) return;
    await api.createAlarm({ label: label.trim(), time, verification, active: true });
    setShowCreate(false);
    setLabel("");
    await load();
  };

  const remove = async (id: string) => {
    await api.deleteAlarm(id);
    await load();
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} testID="alarms-back">
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Smart Alarms</Text>
        <Pressable testID="alarms-add" onPress={() => setShowCreate(true)} style={styles.addBtn}>
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <LinearGradient colors={["#FF5E0022", "#F43F5E22"]} style={styles.hero}>
          <Ionicons name="alarm" size={22} color={colors.primary} />
          <Text style={styles.heroTitle}>Alarms you can't ignore</Text>
          <Text style={styles.heroText}>Complete a challenge to dismiss the alarm. No more mindless snoozes.</Text>
        </LinearGradient>

        {alarms.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No alarms yet. Add one to build unstoppable mornings.</Text>
          </View>
        ) : (
          alarms.map((a) => (
            <View key={a.id} style={styles.alarmCard} testID={`alarm-${a.id}`}>
              <View style={{ flex: 1 }}>
                <Text style={styles.alarmTime}>{a.time}</Text>
                <Text style={styles.alarmLabel}>{a.label}</Text>
                <Text style={styles.alarmMeta}>Verify: {a.verification}</Text>
              </View>
              <Pressable
                testID={`alarm-trigger-${a.id}`}
                onPress={() => router.push(`/alarm/${a.id}`)}
                style={styles.tryBtn}
              >
                <Text style={styles.tryText}>Try now</Text>
              </Pressable>
              <Pressable testID={`alarm-delete-${a.id}`} onPress={() => remove(a.id)} style={styles.delBtn}>
                <Ionicons name="trash" size={16} color={colors.danger} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "flex-end" }}>
            <View style={styles.modal}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>New Smart Alarm</Text>
              <Input testID="alarm-label" label="Label" placeholder="Wake up!" value={label} onChangeText={setLabel} />
              <Input testID="alarm-time" label="Time (HH:MM)" placeholder="07:00" value={time} onChangeText={setTime} />
              <Text style={styles.modalSection}>VERIFICATION METHOD</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
                {VERIFICATIONS.map((v) => (
                  <Pressable
                    key={v.key}
                    testID={`alarm-verif-${v.key}`}
                    onPress={() => setVerification(v.key)}
                    style={[styles.verifChip, verification === v.key && styles.verifChipActive]}
                  >
                    <Ionicons name={v.icon as any} size={14} color={verification === v.key ? colors.primary : colors.text} />
                    <Text style={[styles.verifText, verification === v.key && { color: colors.primary }]}>{v.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={{ height: 16 }} />
              <Button testID="alarm-create-submit" title="Create alarm" onPress={create} disabled={!label.trim()} />
              <View style={{ height: 10 }} />
              <Button testID="alarm-create-cancel" title="Cancel" variant="secondary" onPress={() => setShowCreate(false)} />
              <View style={{ height: 20 }} />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  title: { color: colors.text, fontSize: 22, fontWeight: "800", flex: 1 },
  hero: { padding: 20, borderRadius: radii.xl, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  heroTitle: { color: colors.text, fontSize: 16, fontWeight: "800", marginTop: 8 },
  heroText: { color: colors.textSecondary, marginTop: 4, lineHeight: 20 },
  emptyBox: { padding: 30, alignItems: "center" },
  emptyText: { color: colors.textSecondary, textAlign: "center" },
  alarmCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: radii.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginBottom: 10, gap: 12 },
  alarmTime: { color: colors.text, fontSize: 22, fontWeight: "800" },
  alarmLabel: { color: colors.text, marginTop: 2 },
  alarmMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  tryBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.full, backgroundColor: "rgba(255,94,0,0.15)", borderWidth: 1, borderColor: colors.primary },
  tryText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  delBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgAlt, alignItems: "center", justifyContent: "center" },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay },
  modal: { backgroundColor: colors.bgAlt, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.borderStrong, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: "800", marginBottom: 12 },
  modalSection: { color: colors.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 10 },
  verifChip: { flexDirection: "row", gap: 6, height: 36, paddingHorizontal: 14, borderRadius: radii.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong, alignItems: "center", flexShrink: 0 },
  verifChipActive: { borderColor: colors.primary, backgroundColor: "rgba(255,94,0,0.12)" },
  verifText: { color: colors.text, fontWeight: "600", fontSize: 12 },
});
