import React from "react";
import { View, Text, StyleSheet, Pressable, ViewStyle, TextStyle, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii } from "@/src/theme";

type Props = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  icon?: React.ReactNode;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  fullWidth = true,
  style,
  textStyle,
  testID,
  icon,
}: Props) {
  const content = (
    <View style={styles.content}>
      {icon && <View style={styles.icon}>{icon}</View>}
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text
          style={[
            styles.text,
            variant === "ghost" && { color: colors.text },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </View>
  );

  if (variant === "primary") {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.wrap,
          fullWidth && { width: "100%" },
          pressed && { transform: [{ scale: 0.97 }] },
          disabled && { opacity: 0.5 },
          style,
        ]}
      >
        <LinearGradient
          colors={[colors.primary, "#F43F5E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.wrap,
        fullWidth && { width: "100%" },
        variant === "secondary" ? styles.secondary : styles.ghost,
        pressed && { transform: [{ scale: 0.97 }] },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.full,
    overflow: "hidden",
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
  },
  secondary: {
    backgroundColor: colors.cardAlt,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  ghost: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  icon: { marginRight: 4 },
  text: { color: "#fff", fontWeight: "700", fontSize: 16, letterSpacing: 0.2 },
});
