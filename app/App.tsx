import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";
import { AuthScreen } from "./screens/AuthScreen";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthScreen />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
