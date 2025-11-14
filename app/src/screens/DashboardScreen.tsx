import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AccountCard } from "../components/AccountCard";
import { CategoryChart } from "../components/CategoryChart";
import { TransactionList } from "../components/TransactionList";
import { useFinancialData, useRecentTransactions, useTotals } from "../hooks/useFinancialData";
import { useLinkedInstitution } from "../hooks/useLinkedInstitution";
import { useSpendingInsights } from "../hooks/useSpendingInsights";

export const DashboardScreen = () => {
  const { data } = useFinancialData();
  const accounts = data?.accounts ?? [];
  const transactions = data?.transactions ?? [];
  const totals = useTotals(transactions);
  const recentTransactions = useRecentTransactions(transactions, 5);
  const { data: insights } = useSpendingInsights(transactions);
  const { institution, ready, setInstitution } = useLinkedInstitution();

  return (
    <SafeAreaView className="bg-slate-950 flex-1">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="py-6">
          <Text className="text-lg text-slate-400">
            Track where your money goes
          </Text>
          <Text className="text-3xl font-bold text-slate-100 mt-1">
            Financial Tracker
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          className="bg-slate-900 rounded-2xl p-4 mb-6"
          onPress={() =>
            setInstitution(institution ? null : "Demo Bank (sandbox)")
          }
        >
          <Text className="text-slate-400 text-xs">Linked account</Text>
          <Text className="text-slate-100 text-lg font-semibold mt-1">
            {ready ? institution ?? "Link an institution" : "Loading..."}
          </Text>
          <Text className="text-sky-400 text-xs mt-2">
            {institution
              ? "Tap to unlink sample data"
              : "Tap to simulate Plaid link"}
          </Text>
        </TouchableOpacity>

        <View className="flex-row mb-6">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </View>

        <View className="flex-row justify-between bg-slate-900 rounded-2xl p-4 mb-6">
          <View>
            <Text className="text-slate-400 text-xs">Income</Text>
            <Text className="text-emerald-400 text-2xl font-bold">
              ${totals.income.toFixed(2)}
            </Text>
          </View>
          <View>
            <Text className="text-slate-400 text-xs">Expenses</Text>
            <Text className="text-rose-400 text-2xl font-bold">
              ${totals.expenses.toFixed(2)}
            </Text>
          </View>
          <View>
            <Text className="text-slate-400 text-xs">Net</Text>
            <Text className="text-white text-2xl font-bold">
              ${totals.net.toFixed(2)}
            </Text>
          </View>
        </View>

        <View className="bg-slate-900 rounded-2xl p-4 mb-6">
          <Text className="text-slate-200 text-base font-semibold mb-4">
            Top categories
          </Text>
          <CategoryChart data={insights?.categoryTotals ?? []} />
        </View>

        <View className="bg-slate-900 rounded-2xl p-4">
          <Text className="text-slate-200 text-base font-semibold mb-4">
            Latest transactions
          </Text>
          <TransactionList
            transactions={recentTransactions}
            emptyLabel="No transactions yet"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
