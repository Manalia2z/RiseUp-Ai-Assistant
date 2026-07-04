import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radii } from "@/src/theme";

export function Chip({
  label,
  active,
  onPress,
  testID,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      onTouchEnd={onPress}
      style={[styles.chip, active && styles.active]}
    >
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  active: {
    borderColor: colors.primary,
    backgroundColor: "rgba(255,94,0,0.12)",
  },
  text: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
  textActive: { color: colors.primary },
});
