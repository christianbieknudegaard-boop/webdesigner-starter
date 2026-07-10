import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import HomeScreen from "./src/screens/HomeScreen";
import SellScreen from "./src/screens/SellScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import { AuthProvider } from "./src/AuthContext";
import { colors } from "./src/theme";

const Tab = createBottomTabNavigator();

const TABS = [
  { name: "Hjem", component: HomeScreen, icon: "📚", title: "Bokfink" },
  { name: "Selg", component: SellScreen, icon: "🏷️", title: "Selg en bok" },
  { name: "Min side", component: ProfileScreen, icon: "👤", title: "Min side" },
];

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

function AppNavigator() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.brand },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "800" },
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.muted,
        }}
      >
        {TABS.map((tab) => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={{
              title: tab.title,
              tabBarIcon: () => <Text>{tab.icon}</Text>,
            }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
