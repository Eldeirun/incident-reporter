import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSettings } from "../context/SettingsContext";

const light = {
  canvas: "#F2F6F5",
  surface: "#FFFFFF",
  ink: "#173B3A",
  muted: "#6B7E7C",
  line: "#DCE8E5",
  teal: "#247A78",
  tealSoft: "#E4F1EF",
};

const dark = {
  canvas: "#122322",
  surface: "#1C3230",
  ink: "#EAF4F1",
  muted: "#A8BFBB",
  line: "#31504C",
  teal: "#67C1B5",
  tealSoft: "#244844",
};

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const {
    notificationsEnabled,
    darkMode,
    notificationDistance,
    setNotificationsEnabled,
    setDarkMode,
    setNotificationDistance,
  } = useSettings();
  const colors = darkMode ? dark : light;
  const [distanceText, setDistanceText] = useState(
    notificationDistance?.toString() ?? "",
  );

  useEffect(() => {
    setDistanceText(notificationDistance?.toString() ?? "");
  }, [notificationDistance]);

  const handleDistanceChange = (value: string) => {
    setDistanceText(value);
    if (!value.trim()) {
      setNotificationDistance(null);
      return;
    }

    const distance = Number(value);
    if (Number.isFinite(distance) && distance > 0) {
      setNotificationDistance(distance);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.line },
        ]}
      >
        <TouchableOpacity
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={[styles.backText, { color: colors.teal }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.ink }]}>Settings</Text>
        <View style={styles.headerSpace} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>
          PREFERENCES
        </Text>
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.line },
          ]}
        >
          <View style={styles.row}>
            <View style={styles.rowCopy}>
              <Text style={[styles.rowTitle, { color: colors.ink }]}>
                Notifications
              </Text>
              <Text style={[styles.rowDescription, { color: colors.muted }]}>
                Get alerts about new incidents nearby
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.line, true: colors.teal }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.line }]} />

          <View style={styles.row}>
            <View style={styles.rowCopy}>
              <Text style={[styles.rowTitle, { color: colors.ink }]}>
                Dark mode
              </Text>
              <Text style={[styles.rowDescription, { color: colors.muted }]}>
                Use darker colors throughout the app
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: colors.line, true: colors.teal }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.muted }]}>
          NOTIFICATION RANGE
        </Text>
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.line },
          ]}
        >
          <Text style={[styles.rowTitle, { color: colors.ink }]}>
            Override distance
          </Text>
          <Text style={[styles.rowDescription, { color: colors.muted }]}>
            Only alert me about incidents within this range.
          </Text>
          <View style={styles.distanceRow}>
            <TextInput
              style={[
                styles.distanceInput,
                {
                  color: colors.ink,
                  borderColor: colors.line,
                  backgroundColor: colors.canvas,
                },
              ]}
              value={distanceText}
              onChangeText={handleDistanceChange}
              keyboardType="decimal-pad"
              placeholder="Automatic"
              placeholderTextColor={colors.muted}
            />
            <Text style={[styles.unit, { color: colors.muted }]}>km</Text>
            {notificationDistance !== null && (
              <TouchableOpacity
                onPress={() => {
                  setDistanceText("");
                  setNotificationDistance(null);
                }}
              >
                <Text style={[styles.clearText, { color: colors.teal }]}>
                  Clear
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.helper, { color: colors.muted }]}>
            Leave blank to use the automatic range based on your speed.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 104,
    paddingTop: 48,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  backButton: { width: 40 },
  backText: { fontSize: 38, lineHeight: 38, fontWeight: "300" },
  headerSpace: { width: 40 },
  title: { fontSize: 21, fontWeight: "800" },
  content: { padding: 16, paddingBottom: 32 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 8,
  },
  section: { borderWidth: 1, borderRadius: 10, padding: 16 },
  row: { flexDirection: "row", alignItems: "center", minHeight: 58 },
  rowCopy: { flex: 1, paddingRight: 16 },
  rowTitle: { fontSize: 16, fontWeight: "800" },
  rowDescription: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  divider: { height: 1, marginVertical: 12 },
  distanceRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  distanceInput: {
    width: 120,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  unit: { marginLeft: 8, fontSize: 15 },
  clearText: { marginLeft: 16, fontWeight: "800" },
  helper: { fontSize: 12, lineHeight: 18, marginTop: 10 },
});
