import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthForm } from "../components/AuthForm";

export const AuthScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#060112", "#0b0220", "#150433"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.appLabel}>FLOWTRACK</Text>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>
            Stay connected to your credits, investments, and cash flow from one
            calm surface.
          </Text>
        </View>

        <View style={styles.formCard}>
          <AuthForm />
        </View>

        <Text style={styles.footerLink}>Forgot password?</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#060112",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    justifyContent: "space-between",
  },
  header: {
    gap: 12,
  },
  appLabel: {
    fontSize: 12,
    letterSpacing: 6,
    color: "#a855f7",
    fontWeight: "700",
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#f8fafc",
  },
  subtitle: {
    fontSize: 16,
    color: "#cbd5f5",
  },
  formCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 24,
    backgroundColor: "rgba(12, 10, 25, 0.85)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 15 },
    elevation: 8,
  },
  footerLink: {
    textAlign: "center",
    fontSize: 12,
    color: "#94a3b8",
  },
});
