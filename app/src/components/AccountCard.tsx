import { memo } from "react";
import { Text, View } from "react-native";
import type { Account } from "../types/finance";

type Props = {
  account: Account;
};

export const AccountCard = memo(({ account }: Props) => (
  <View
    className="flex-1 rounded-2xl bg-slate-900 p-4 mr-3"
    style={{ backgroundColor: account.color }}
  >
    <Text className="text-white/80 text-xs">{account.institution}</Text>
    <Text className="text-white text-xl font-semibold">{account.name}</Text>
    <Text className="text-white text-3xl font-bold mt-3">
      ${account.balance.toFixed(2)}
    </Text>
  </View>
));

AccountCard.displayName = "AccountCard";
