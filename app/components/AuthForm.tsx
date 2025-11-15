import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FormField } from "./FormField";

export const AuthForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = useCallback(() => {
    console.log("Auth submit", { email, password });
  }, [email, password]);

  return (
    <View className="gap-6 rounded-[28px] border border-white/5 bg-surface p-6">
      <FormField
        label="Email"
        placeholder="you@email.com"
        autoCapitalize="none"
        keyboardType="email-address"
        inputMode="email"
        value={email}
        onChangeText={setEmail}
      />
      <FormField
        label="Password"
        placeholder="Enter password"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
        trailingAccessory={
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              showPassword ? "Hide password" : "Show password"
            }
          >
            <Feather
              name={showPassword ? "eye" : "eye-off"}
              size={18}
              color="#E1E7FF"
            />
          </Pressable>
        }
      />

      <Pressable
        onPress={handleSubmit}
        accessibilityRole="button"
        className="rounded-2xl shadow-lg shadow-aurora-purple/20"
        style={({ pressed }) => [
          styles.buttonContainer,
          pressed && styles.buttonPressed,
        ]}
      >
        <LinearGradient
          style={styles.buttonGradient}
          colors={["#945BFF", "#2CFACB"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        >
          <Text className="text-center text-base font-semibold text-text-primary">
            Continue
          </Text>
        </LinearGradient>
      </Pressable>

      <Text className="mt-6 text-center text-sm text-[#fff] opacity-60">
        Forgot password?
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    overflow: "hidden",
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonGradient: {
    paddingVertical: 16,
    borderRadius: 16,
  },
});
