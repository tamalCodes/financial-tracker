import { Feather } from "@expo/vector-icons";
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
    <View style={styles.form}>
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
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          >
            <Feather
              name={showPassword ? "eye" : "eye-off"}
              size={18}
              color="#D1D5DB"
            />
          </Pressable>
        }
      />

      <Pressable
        onPress={handleSubmit}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.primaryButtonPressed,
        ]}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </Pressable>

      <Text style={styles.helperText}>
        Continue with your email to sign in or create a workspace. One step, one
        surface.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 20,
  },
  primaryButton: {
    backgroundColor: "#7C5CFF",
    borderRadius: 16,
    paddingVertical: 14,
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonText: {
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  helperText: {
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
    lineHeight: 18,
  },
});

