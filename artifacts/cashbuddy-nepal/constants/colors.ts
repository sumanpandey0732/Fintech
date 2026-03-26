export const COLORS = {
  // Blue gradient primary
  primary: "#1565C0",
  primaryDark: "#0D47A1",
  primaryLight: "#1E88E5",
  primaryDeep: "#0A1628",

  // Accent
  accent: "#FFD700",
  accentLight: "#FFEB3B",
  accentOrange: "#FF6D00",

  // Success/Income
  success: "#00C853",
  successLight: "#69F0AE",

  // Error/Expense
  error: "#FF1744",
  errorLight: "#FF8A80",

  // Gradients
  gradientStart: "#0D1B4B",
  gradientMid: "#1565C0",
  gradientEnd: "#42A5F5",

  // Glass morphism
  glassWhite: "rgba(255,255,255,0.12)",
  glassWhiteMedium: "rgba(255,255,255,0.18)",
  glassBorder: "rgba(255,255,255,0.25)",
  glassDark: "rgba(0,0,0,0.3)",

  // Neutral
  white: "#FFFFFF",
  black: "#000000",
  gray50: "#F8FAFF",
  gray100: "#EEF2FF",
  gray200: "#E0E7FF",
  gray300: "#C7D2FE",
  gray400: "#818CF8",
  gray500: "#6366F1",
  gray600: "#4F46E5",
  gray700: "#3730A3",
  gray800: "#1E1B4B",
  gray900: "#0F0A2B",

  // Dark mode
  darkBg: "#060D1F",
  darkCard: "#0F1C36",
  darkCardSecondary: "#162040",
  darkBorder: "#1E2D50",
  darkText: "#E8F0FE",
  darkTextSecondary: "#9AA5B8",

  // Light mode
  lightBg: "#F0F4FF",
  lightCard: "#FFFFFF",
  lightBorder: "#DBEAFE",
  lightText: "#0D1B4B",
  lightTextSecondary: "#4A5568",

  // Category colors
  food: "#FF6B6B",
  transport: "#4ECDC4",
  shopping: "#A78BFA",
  health: "#06D6A0",
  entertainment: "#FFD166",
  education: "#118AB2",
  bills: "#EF476F",
  salary: "#00C853",
  freelance: "#FFB300",
  investment: "#1565C0",
  other: "#94A3B8",
};

export const GRADIENTS = {
  primary: ["#0D1B4B", "#1565C0", "#42A5F5"] as const,
  primaryShort: ["#0D47A1", "#1565C0"] as const,
  card: ["rgba(21,101,192,0.15)", "rgba(66,165,245,0.05)"] as const,
  success: ["#00897B", "#00C853"] as const,
  error: ["#C62828", "#FF1744"] as const,
  accent: ["#E65100", "#FF6D00"] as const,
  dark: ["#060D1F", "#0D1B4B"] as const,
};

export default COLORS;
