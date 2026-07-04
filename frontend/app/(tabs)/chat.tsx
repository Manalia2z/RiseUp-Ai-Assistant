import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { api } from "@/src/api/client";
import { useAuth } from "@/src/context/AuthContext";
import { colors, radii } from "@/src/theme";

type Msg = { id?: string; role: "user" | "assistant"; text: string; created_at?: string };

const QUICK_PROMPTS = [
  "I'm feeling lazy today",
  "I don't want to study",
  "I skipped gym, help",
  "I'm stressed out",
  "I don't feel confident",
];

export default function ChatTab() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      const hist: any[] = await api.chatHistory();
      setMessages(hist.length ? hist : [{
        role: "assistant",
        text: `Hey ${user?.name || "friend"}! I'm your RiseUp AI coach 👋. Tell me what's on your mind — I'm here for you.`,
      }]);
    } catch {
      setMessages([{ role: "assistant", text: "Hi! I'm here whenever you need me." }]);
    }
  }, [user?.name]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setSending(true);
    try {
      const res: any = await api.chatSend(msg);
      setMessages((m) => [...m, { role: "assistant", text: res.reply }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", text: "I'm here, but had a hiccup. Try again in a moment." }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <LinearGradient colors={["#FF5E00", "#F43F5E"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.avatar}>
          <Ionicons name="sparkles" size={20} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName}>RiseUp Coach</Text>
          <Text style={styles.headerSub}>{user?.ai_personality} • Always here</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }} keyboardVerticalOffset={insets.bottom + 60}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.chatArea}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((m, i) => (
            <View key={i} style={[styles.bubbleWrap, m.role === "user" ? styles.userWrap : styles.aiWrap]}>
              {m.role === "assistant" && (
                <View style={styles.bubbleAvatar}>
                  <Ionicons name="sparkles" size={12} color={colors.primary} />
                </View>
              )}
              <View style={[styles.bubble, m.role === "user" ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.bubbleText, m.role === "user" && { color: "#fff" }]}>{m.text}</Text>
              </View>
            </View>
          ))}
          {sending && (
            <View style={[styles.bubbleWrap, styles.aiWrap]}>
              <View style={styles.bubbleAvatar}><ActivityIndicator size="small" color={colors.primary} /></View>
              <View style={[styles.bubble, styles.aiBubble]}>
                <Text style={[styles.bubbleText, { color: colors.textMuted }]}>Thinking…</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {messages.length <= 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
            {QUICK_PROMPTS.map((p) => (
              <Pressable key={p} testID={`quick-prompt-${p.slice(0,8).replace(/\s/g,'-')}`} onPress={() => send(p)} style={styles.quickChip}>
                <Text style={styles.quickText}>{p}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={styles.inputRow}>
          <TextInput
            testID="chat-input"
            style={styles.input}
            placeholder="Talk to your coach..."
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
          />
          <Pressable
            testID="chat-send-button"
            onPress={() => send()}
            disabled={sending || !input.trim()}
            style={[styles.sendBtn, (!input.trim() || sending) && { opacity: 0.4 }]}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: "center",
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  headerName: { color: colors.text, fontWeight: "800", fontSize: 16 },
  headerSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  chatArea: { padding: 16, paddingBottom: 12, gap: 10 },
  bubbleWrap: { flexDirection: "row", alignItems: "flex-end", gap: 6, marginBottom: 4 },
  userWrap: { justifyContent: "flex-end" },
  aiWrap: { justifyContent: "flex-start" },
  bubbleAvatar: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(255,94,0,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  bubble: { maxWidth: "78%", padding: 12, borderRadius: 18 },
  aiBubble: { backgroundColor: colors.card, borderTopLeftRadius: 4 },
  userBubble: { backgroundColor: colors.primary, borderTopRightRadius: 4 },
  bubbleText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  quickRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  quickChip: { height: 36, paddingHorizontal: 14, borderRadius: radii.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong, justifyContent: "center", flexShrink: 0 },
  quickText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  inputRow: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.card,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
});
