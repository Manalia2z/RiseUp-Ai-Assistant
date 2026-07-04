import React from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";
import { colors, radii } from "@/src/theme";

type Props = TextInputProps & {
  label?: string;
  error?: string;
  testID?: string;
};

export function Input({ label, error, style, testID, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        testID={testID}
        placeholderTextColor={colors.textMuted}
        {...rest}
        style={[styles.input, error ? { borderColor: colors.danger } : null, style]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", marginBottom: 12 },
  label: { color: colors.textSecondary, fontWeight: "600", marginBottom: 8, fontSize: 13, letterSpacing: 0.2 },
  input: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    fontSize: 15,
  },
  error: { color: colors.danger, marginTop: 6, fontSize: 12 },
});
