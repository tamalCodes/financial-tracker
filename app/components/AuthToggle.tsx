import { FC } from "react";
import { Pressable, Text, View } from "react-native";

type AuthMode = "signin" | "signup";

interface AuthToggleProps {
  mode: AuthMode;
  onChange: (mode: AuthMode) => void;
}

const segments: Array<{ label: string; value: AuthMode }> = [
  { label: "Sign in", value: "signin" },
  { label: "Create account", value: "signup" },
];

export const AuthToggle: FC<AuthToggleProps> = ({ mode, onChange }) => {
  return (
    <View className="mb-6 flex-row rounded-2xl border border-white/5 bg-white/5 p-1">
      {segments.map(({ label, value }) => {
        const active = mode === value;
        return (
          <Pressable
            key={value}
            onPress={() => onChange(value)}
            className={`flex-1 rounded-2xl px-4 py-3 ${
              active ? "bg-white/20" : "bg-transparent"
            }`}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                active ? "text-white" : "text-slate-400"
              }`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export type { AuthMode };
