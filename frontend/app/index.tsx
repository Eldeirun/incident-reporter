import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import LoginScreen from "../src/pages/LoginScreen";
import RegisterScreen from "../src/pages/RegisterScreen";
import { Text, View } from "react-native";
import MapScreen from "../src/pages/MapScreen";

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
        <Stack.Screen name="Map" component={MapScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function Index() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
