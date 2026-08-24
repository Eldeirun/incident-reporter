import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSettings } from "../context/SettingsContext";

const palette = {
  ink: "#173B3A",
  muted: "#6B7E7C",
  softMuted: "#8EA09D",
  surface: "#FFFFFF",
  line: "#DCE8E5",
  teal: "#247A78",
  canvas: "#F2F6F5",
  coral: "#D86658",
};

const INCIDENT_TYPES = [
  "Crash",
  "Speed Limit Drop",
  "Construction",
  "Closed Lane",
  "Object on Road",
];
const SEVERITY_LEVELS = ["Low", "Medium", "High", "Severe"];

interface Props {
  visible: boolean;
  latitude: number;
  longitude: number;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function IncidentFormModal({
  visible,
  latitude,
  longitude,
  onClose,
  onSubmit,
}: Props) {
  const { darkMode } = useSettings();
  const [type, setType] = useState(INCIDENT_TYPES[0]);
  const [severity, setSeverity] = useState(SEVERITY_LEVELS[0]);
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    onSubmit({ type, severity, description, lat: latitude, lon: longitude });
    setDescription("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <ScrollView
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.container, darkMode && styles.containerDark]}>
            <Text style={[styles.title, darkMode && styles.titleDark]}>
              Report Incident
            </Text>
            <Text style={[styles.coords, darkMode && styles.coordsDark]}>
              📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </Text>

            <Text style={[styles.label, darkMode && styles.labelDark]}>
              Type
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.optionRow}
              keyboardShouldPersistTaps="handled"
            >
              {INCIDENT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.option,
                    darkMode && styles.optionDark,
                    type === t && styles.optionSelected,
                  ]}
                  onPress={() => setType(t)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      darkMode && styles.optionTextDark,
                      type === t && styles.optionTextSelected,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, darkMode && styles.labelDark]}>
              Severity
            </Text>
            <View style={styles.optionRow}>
              {SEVERITY_LEVELS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.option,
                    darkMode && styles.optionDark,
                    severity === s && styles.optionSelected,
                  ]}
                  onPress={() => setSeverity(s)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      darkMode && styles.optionTextDark,
                      severity === s && styles.optionTextSelected,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, darkMode && styles.labelDark]}>
              Description (optional)
            </Text>
            <TextInput
              style={[styles.input, darkMode && styles.inputDark]}
              placeholder="What happened?"
              placeholderTextColor={
                darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)"
              }
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.buttons}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitText}>Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
  },
  sheetContent: { flexGrow: 1, justifyContent: "flex-end" },
  containerDark: { backgroundColor: "#1C3230" },
  title: {
    color: palette.ink,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  titleDark: { color: "#EAF4F1" },
  coords: { color: palette.softMuted, marginBottom: 16, fontSize: 12 },
  coordsDark: { color: "#7F9D98" },
  labelDark: { color: "#EAF4F1" },
  label: {
    color: palette.ink,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 12,
  },
  optionRow: { flexDirection: "row", marginBottom: 4 },
  option: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  optionDark: { borderColor: "#31504C" },
  optionSelected: { backgroundColor: palette.teal, borderColor: palette.teal },
  optionText: { color: palette.muted },
  optionTextDark: { color: "#A8BFBB" },
  inputDark: {
    backgroundColor: "#122322",
    borderColor: "#31504C",
    color: "#EAF4F1",
  },
  optionTextSelected: { color: palette.surface, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 10,
    backgroundColor: palette.canvas,
    color: palette.ink,
    padding: 12,
    marginTop: 4,
    textAlignVertical: "top",
  },
  buttons: { flexDirection: "row", marginTop: 20, gap: 12 },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: "center",
  },
  cancelText: { color: palette.muted, fontWeight: "700" },
  submitButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: palette.coral,
    alignItems: "center",
  },
  submitText: { color: palette.surface, fontWeight: "800" },
});
