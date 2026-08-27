import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { adminLogin } from "../services/api";

const lightTheme = {
  canvas: "#FFFFFF",
  ink: "#173B3A",
  muted: "#6B7E7C",
  line: "#CCCCCC",
  input: "#111827",
  placeholder: "#6B7E7C",
  button: "#D86658",
  link: "#D86658",
};

const darkTheme = {
  canvas: "#122322",
  ink: "#EAF4F1",
  muted: "#A8BFBB",
  line: "#31504C",
  input: "#EAF4F1",
  placeholder: "#A8BFBB",
  button: "#D86658",
  link: "#67C1B5",
};

export default function AdminLoginScreen({ navigation }: any) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { loginUser } = useAuth();
  const { darkMode, setDarkMode } = useSettings();
  const theme = darkMode ? darkTheme : lightTheme;

  const handleLogin = async () => {
    try {
      const response = await adminLogin(username, password);
      loginUser(response.data.access_token, response.data.user);
    } catch {
      Alert.alert("Error", "Administrator credentials are invalid");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.canvas }]}>
      <View style={styles.themeRow}>
        <Text style={[styles.themeLabel, { color: theme.muted }]}>
          Switch Themes
        </Text>
        <Switch
          value={darkMode}
          onValueChange={setDarkMode}
          trackColor={{ false: theme.line, true: "#247A78" }}
          thumbColor="#FFFFFF"
        />
      </View>
      <Text style={[styles.title, { color: theme.ink }]}>
        Administrator access
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            color: theme.input,
            borderColor: theme.line,
            backgroundColor: theme.canvas,
          },
        ]}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholderTextColor={theme.placeholder}
      />
      <TextInput
        style={[
          styles.input,
          {
            color: theme.input,
            borderColor: theme.line,
            backgroundColor: theme.canvas,
          },
        ]}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={theme.placeholder}
      />
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.button }]}
        onPress={handleLogin}
      >
        <Text style={styles.buttonText}>Administrator login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={[styles.link, { color: theme.link }]}>
          Back to regular login
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  themeRow: {
    position: "absolute",
    top: 52,
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  themeLabel: { fontSize: 13 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#e74c3c",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  link: { textAlign: "center", marginTop: 4 },
});
