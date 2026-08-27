import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import LoginScreen from "../src/pages/LoginScreen";
import RegisterScreen from "../src/pages/RegisterScreen";
import MapScreen from "../src/pages/MapScreen";
import { IncidentsProvider } from "../src/context/IncidentsContext";
import SettingsScreen from "../src/pages/SettingsScreen";
import { SettingsProvider } from "../src/context/SettingsContext";
import AdminLoginScreen from "../src/pages/AdminLoginScreen";
import AdminScreen from "../src/pages/AdminScreen";
import AnalyticsScreen from "../src/pages/AnalyticsScreen";

const Stack = createStackNavigator();

function AppNavigator() {
  const { token, user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
        </>
      ) : (
        <>
          {user?.role === "administrator" ? (
            <Stack.Screen name="Admin" component={AdminScreen} />
          ) : (
            <>
              <Stack.Screen name="Map" component={MapScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              {user?.role === "police" && (
                <Stack.Screen name="Analytics" component={AnalyticsScreen} />
              )}
            </>
          )}
        </>
      )}
    </Stack.Navigator>
  );
}

export default function Index() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <IncidentsProvider>
          <AppNavigator />
        </IncidentsProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
