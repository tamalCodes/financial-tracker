import { Feather } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { FormField } from "./FormField";

export const AuthForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = useCallback(() => {
    console.log("Auth submit", { email, password });
  }, [email, password]);

  return (
    <View className="gap-6">
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
              color="#cbd5f5"
            />
          </Pressable>
        }
      />

      <Pressable
        onPress={handleSubmit}
        style={({ pressed }) => ({
          opacity: pressed ? 0.9 : 1,
        })}
        className="rounded-2xl bg-[#8b5cf6] py-4"
      >
        <Text className="text-center text-base font-semibold text-white">
          Continue
        </Text>
      </Pressable>

      <Text className="text-center text-xs text-slate-400">
        Use your email to sign in or create a workspace. We'll guide you either
        way.
      </Text>
    </View>
  );
};

