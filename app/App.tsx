import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { TransactionsScreen } from "./src/screens/TransactionsScreen";

const Stack = createNativeStackNavigator();
const queryClient = new QueryClient();

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#020617",
    card: "#020617",
    primary: "#0EA5E9",
    text: "#F8FAFC",
    border: "#1E293B",
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <NavigationContainer theme={AppTheme}>
              <StatusBar style="light" />
              <AuthGate />
            </NavigationContainer>
          </QueryClientProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const AuthGate = () => {
  const { isAuthenticated, login } = useAuth();

  if (!isAuthenticated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#020617",
        }}
      >
        <Text style={{ color: "#F1F5F9", fontSize: 18, marginBottom: 12 }}>
          Please sign in to continue
        </Text>
        <TouchableOpacity
          onPress={() => login()}
          style={{
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: "#0EA5E9",
            borderRadius: 999,
          }}
        >
          <Text style={{ color: "#0F172A", fontWeight: "600" }}>Sign in</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleStyle: { fontSize: 16 },
        headerLargeTitle: true,
        headerTransparent: true,
        headerTintColor: "#F8FAFC",
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: "Overview" }}
      />
      <Stack.Screen name="Transactions" component={TransactionsScreen} />
    </Stack.Navigator>
  );
};
