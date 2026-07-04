import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "@/src/components/Input";
import { Button } from "@/src/components/Button";
import { useAuth } from "@/src/context/AuthContext";
import { colors } from "@/src/theme";

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setError(null);
    setLoading(true);
    try {
      await register(email.trim().toLowerCase(), password, name.trim() || "Friend");
      router.replace("/");
    } catch (e: any) {
      setError(e.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="register-back">
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>

          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Let's build the best version of you.</Text>

          <View style={{ marginTop: 32 }}>
            <Input
              testID="register-name-input"
              label="Your name"
              placeholder="How should I call you?"
              value={name}
              onChangeText={setName}
            />
            <Input
              testID="register-email-input"
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              testID="register-password-input"
              label="Password"
              placeholder="At least 6 characters"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {error && <Text style={styles.error} testID="register-error">{error}</Text>}
            <View style={{ height: 16 }} />
            <Button
              testID="register-submit-button"
              title={loading ? "Creating..." : "Create account"}
              onPress={handle}
              loading={loading}
              disabled={!email || !password || password.length < 6}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" testID="register-goto-login" style={styles.footerLink}>
              Log in
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, flexGrow: 1 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: { color: colors.text, fontSize: 32, fontWeight: "800", letterSpacing: -0.8 },
  subtitle: { color: colors.textSecondary, marginTop: 8, fontSize: 15 },
  error: { color: colors.danger, marginTop: 6, fontSize: 13 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { color: colors.textSecondary },
  footerLink: { color: colors.primary, fontWeight: "700" },
});
