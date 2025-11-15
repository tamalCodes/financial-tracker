import { FC, ReactNode } from "react";
import {
  Text,
  TextInput,
  TextInputProps,
  View,
  TouchableOpacity,
} from "react-native";

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
  return (
    <View className="mb-5 gap-2">
      <View className="flex-row items-baseline justify-between">
        <View>
          <Text className="text-xs font-semibold uppercase tracking-[3px] text-slate-300">
            {label}
          </Text>
          {hint ? (
            <Text className="text-xs text-slate-500">{hint}</Text>
          ) : null}
        </View>
        {trailingActionLabel ? (
          <TouchableOpacity onPress={onTrailingActionPress}>
            <Text className="text-xs font-semibold text-[#a78bfa]">
              {trailingActionLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View className="relative">
        <TextInput
          placeholderTextColor="#94a3b8"
          className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-4 pr-12 text-base text-white shadow-sm focus:border-[#8b5cf6] focus:bg-white/15"
          secureTextEntry={secureTextEntry}
          {...inputProps}
        />
        {trailingAccessory ? (
          <View className="pointer-events-auto absolute inset-y-0 right-4 flex-row items-center">
            {trailingAccessory}
          </View>
        ) : null}
      </View>
    </View>
  );
};
