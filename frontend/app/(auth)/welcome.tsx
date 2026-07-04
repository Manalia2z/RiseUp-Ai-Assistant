import React from "react";
import { View, Text, StyleSheet, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/src/components/Button";
import { colors } from "@/src/theme";

export default function Welcome() {
  const router = useRouter();
  return (
    <View style={styles.root} testID="welcome-screen">
      <ImageBackground
        source={{ uri: "https://images.pexels.com/photos/13026928/pexels-photo-13026928.jpeg" }}
        style={styles.bg}
        imageStyle={{ opacity: 0.55 }}
      >
        <LinearGradient
          colors={["rgba(10,10,10,0.4)", "rgba(10,10,10,0.85)", "rgba(10,10,10,1)"]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.top}>
            <View style={styles.logoBadge}>
              <Ionicons name="flash" size={28} color={colors.primary} />
            </View>
            <Text style={styles.brand}>RiseUp AI</Text>
            <Text style={styles.subtitle}>Your AI Friend Who Never Lets You Give Up.</Text>
          </View>

          <View style={styles.features}>
            {[
              { icon: "sparkles", label: "AI Coach with real empathy" },
              { icon: "trophy", label: "Goals, habits & streaks" },
              { icon: "calendar", label: "Smart daily & weekly plans" },
              { icon: "heart", label: "Mood, journal & wellness" },
            ].map((f) => (
              <View style={styles.featureRow} key={f.label}>
                <Ionicons name={f.icon as any} size={18} color={colors.primary} />
                <Text style={styles.featureText}>{f.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <Button
              testID="welcome-get-started-btn"
              title="Get Started"
              onPress={() => router.push("/(auth)/register")}
            />
            <View style={{ height: 12 }} />
            <Button
              testID="welcome-login-btn"
              title="I already have an account"
              variant="secondary"
              onPress={() => router.push("/(auth)/login")}
            />
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  bg: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 24, justifyContent: "space-between" },
  top: { marginTop: 24, alignItems: "flex-start" },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,94,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,94,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { color: colors.text, fontSize: 44, fontWeight: "800", marginTop: 20, letterSpacing: -1.2 },
  subtitle: { color: colors.textSecondary, fontSize: 16, marginTop: 8, lineHeight: 22 },
  features: { gap: 12, marginVertical: 24 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: { color: colors.text, fontSize: 14 },
  actions: { paddingBottom: 12 },
});
