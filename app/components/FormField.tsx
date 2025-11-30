import { FC, ReactNode } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";

type FormFieldProps = {
  label: string;
  hint?: string;
  trailingActionLabel?: string;
  onTrailingActionPress?: () => void;
  trailingAccessory?: ReactNode;
} & TextInputProps;

export const FormField: FC<FormFieldProps> = ({
  label,
  hint,
  trailingActionLabel,
  onTrailingActionPress,
  trailingAccessory,
  secureTextEntry,
  ...inputProps
}) => {
  const inputClassName = [
    "w-full rounded-2xl border border-white/10 bg-surface-highlight px-4 py-3 text-base text-text-primary font-outfit-medium",
    trailingAccessory ? "pr-14" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <View className="gap-2">
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="font-outfit-semibold text-[11px] font-semibold uppercase tracking-[0.3em] text-text-subtle">
            {label}
          </Text>
          {hint ? (
            <Text className="font-outfit text-xs text-text-muted">{hint}</Text>
          ) : null}
        </View>
        {trailingActionLabel ? (
          <Pressable onPress={onTrailingActionPress} hitSlop={8}>
            <Text className="font-outfit-semibold text-xs font-semibold text-aurora-purple">
              {trailingActionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <View className="relative">
        <TextInput
          placeholderTextColor="#7C87A9"
          className={inputClassName}
          secureTextEntry={secureTextEntry}
          {...inputProps}
        />
        {trailingAccessory ? (
          <View className="absolute right-4 top-0 bottom-0 flex-row items-center">
            {trailingAccessory}
          </View>
        ) : null}
      </View>
    </View>
  );
};
