import { FC, ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type SocialButtonProps = {
  label: string;
  icon?: ReactNode;
  onPress?: () => void;
};

export const SocialButton: FC<SocialButtonProps> = ({
  label,
  icon,
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-4"
    >
      {icon ? <View>{icon}</View> : null}
      <Text className="text-sm font-semibold text-white">{label}</Text>
    </Pressable>
  );
};
