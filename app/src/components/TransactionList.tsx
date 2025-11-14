import { memo } from "react";
import { FlatList, Text, View } from "react-native";
import type { Transaction } from "../types/finance";

type Props = {
  transactions: Transaction[];
  emptyLabel?: string;
};

const TransactionItem = ({ item }: { item: Transaction }) => (
  <View className="flex-row items-center justify-between py-3 border-b border-slate-800">
    <View>
      <Text className="text-base font-semibold text-slate-100">
        {item.merchant}
      </Text>
      <Text className="text-xs text-slate-400">
        {item.category} • {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </View>
    <Text
      className={`text-base font-semibold ${
        item.type === "income" ? "text-emerald-400" : "text-rose-400"
      }`}
    >
      {item.type === "income" ? "+" : "-"}${item.amount.toFixed(2)}
    </Text>
  </View>
);

export const TransactionList = memo(
  ({ transactions, emptyLabel = "No items yet" }: Props) => (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.id}
      renderItem={TransactionItem}
      scrollEnabled={false}
      ListEmptyComponent={
        <Text className="text-center text-slate-500 py-4">{emptyLabel}</Text>
      }
    />
  )
);

TransactionList.displayName = "TransactionList";
