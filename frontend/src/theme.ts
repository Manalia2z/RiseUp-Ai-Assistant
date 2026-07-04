// Design tokens for RiseUp AI - Tactical Empathy dark palette
export const colors = {
  bg: "#0A0A0A",
  bgAlt: "#111111",
  card: "#141414",
  cardAlt: "#1A1A1A",
  border: "rgba(255,255,255,0.06)",
  borderStrong: "rgba(255,255,255,0.12)",
  primary: "#FF5E00",
  primaryDark: "#E94D00",
  accent: "#3B82F6",
  danger: "#EF4444",
  success: "#10B981",
  warning: "#F59E0B",
  purple: "#8B5CF6",
  pink: "#EC4899",
  text: "#FFFFFF",
  textSecondary: "#B4B4B4",
  textMuted: "#6B6B6B",
  overlay: "rgba(0,0,0,0.6)",
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  full: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const shadows = {
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
};
