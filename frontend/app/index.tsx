import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { colors } from "@/src/theme";

export default function Index() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // no-op
  }, []);

  if (loading) {
    return (
      <View style={styles.container} testID="splash-loading">
        <Text style={styles.brand}>RiseUp AI</Text>
        <Text style={styles.tagline}>Your AI Friend Who Never Lets You Give Up</Text>
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (!user.onboarded) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  brand: { color: colors.text, fontSize: 40, fontWeight: "800", letterSpacing: -1 },
  tagline: { color: colors.textSecondary, marginTop: 8, textAlign: "center", fontSize: 14 },
});
