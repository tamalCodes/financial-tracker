import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthForm } from "../components/AuthForm";

export const AuthScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-space-950">
      <View className="flex-1 px-6 pt-6 pb-8">
        <View className="absolute inset-0" pointerEvents="none">
          <LinearGradient
            style={styles.gradientFill}
            colors={["#01020A", "#030414", "#050816", "#02010C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>
        <View pointerEvents="none" style={styles.accentGlow}>
          <LinearGradient
            style={styles.gradientFill}
            colors={[
              "rgba(148,91,255,0.5)",
              "rgba(44,250,203,0.2)",
              "transparent",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>
        {/* <View pointerEvents="none" style={styles.secondaryGlow}>
          <LinearGradient
            style={styles.gradientFill}
            colors={[
              "rgba(148,91,255,0.35)",
              "rgba(244,244,255,0.05)",
              "transparent",
            ]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.7, y: 1 }}
          />
        </View> */}
        <View className="flex-1">
          <View className="gap-4 pb-10">
            <View className="self-start rounded-full border border-white/5 bg-white/5 px-3 py-1">
              <Text className="text-[10px] font-semibold uppercase tracking-[0.4em] text-aurora-teal">
                Flowtrack
              </Text>
            </View>

            <Text className="font-outfit-semibold text-4xl font-semibold leading-tight text-text-primary">
              Sign In
            </Text>
            <Text className="font-outfit text-base leading-6 text-text-muted">
              Monitor your expenses, payments & monthly credits.
            </Text>
          </View>

          <View className="flex-1 flex max-h-[75%] flex-col items-center justify-center">
            <AuthForm />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  gradientFill: StyleSheet.absoluteFillObject,
  accentGlow: {
    position: "absolute",
    top: -50,
    left: 0,
    height: 1420,
    width: 520,
    opacity: 0.45,
  },
  secondaryGlow: {
    position: "absolute",
    bottom: -220,
    left: -120,
    height: 460,
    width: 460,
    opacity: 0.45,
  },
});
