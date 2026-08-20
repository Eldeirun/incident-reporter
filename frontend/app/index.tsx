import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import LoginScreen from "../src/pages/LoginScreen";
import RegisterScreen from "../src/pages/RegisterScreen";
import MapScreen from "../src/pages/MapScreen";
import { IncidentsProvider } from "../src/context/IncidentsContext";
import SettingsScreen from "../src/pages/SettingsScreen";
import { SettingsProvider } from "../src/context/SettingsContext";

const Stack = createStackNavigator();

function AppNavigator() {
  const { token } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Map" component={MapScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
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
