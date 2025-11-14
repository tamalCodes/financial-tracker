import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TransactionList } from "../components/TransactionList";
import { useFinancialData } from "../hooks/useFinancialData";

export const TransactionsScreen = () => {
  const { data } = useFinancialData();
  const accounts = data?.accounts ?? [];
  const transactions = data?.transactions ?? [];

  const grouped = useMemo(() => {
    return accounts.map((account) => ({
      account,
      transactions: transactions.filter((tx) => tx.accountId === account.id),
    }));
  }, [accounts, transactions]);

  return (
    <SafeAreaView className="bg-slate-950 flex-1">
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Text className="text-3xl font-bold text-slate-100 mt-6 mb-4">
          Transactions
        </Text>
        {grouped.map(({ account, transactions: accountTransactions }) => (
          <View key={account.id} className="bg-slate-900 rounded-2xl p-4 mb-4">
            <Text className="text-slate-200 text-lg font-semibold mb-3">
              {account.name}
            </Text>
            <TransactionList
              transactions={accountTransactions}
              emptyLabel="No activity"
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};
