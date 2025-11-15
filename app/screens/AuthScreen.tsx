import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthForm } from "../components/AuthForm";

export const AuthScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#050816", "#02010C"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.content}>
        <View style={styles.body}>
          <View style={styles.header}>
            <Text style={styles.appLabel}>FLOWTRACK</Text>
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>
              Monitor credits, investments, and monthly cash with calm clarity.
            </Text>
          </View>

          <View style={styles.formArea}>
            <AuthForm />
          </View>
        </View>

        <Text style={styles.footerLink}>Forgot password?</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050816",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  body: {
    flex: 1,
  },
  header: {
    gap: 10,
    marginBottom: 32,
  },
  appLabel: {
    fontSize: 12,
    letterSpacing: 6,
    color: "#8B95C9",
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#F9FAFB",
  },
  subtitle: {
    fontSize: 14,
    color: "#A0AEC0",
    lineHeight: 20,
  },
  formArea: {
    flex: 1,
    justifyContent: "flex-start",
  },
  footerLink: {
    textAlign: "center",
    fontSize: 12,
    color: "#A0AEC0",
    marginTop: 32,
  },
});
