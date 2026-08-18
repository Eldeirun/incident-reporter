import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from "react-native";

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
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Report Incident</Text>
          <Text style={styles.coords}>
            📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </Text>

          <Text style={styles.label}>Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.optionRow}
          >
            {INCIDENT_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.option, type === t && styles.optionSelected]}
                onPress={() => setType(t)}
              >
                <Text
                  style={[
                    styles.optionText,
                    type === t && styles.optionTextSelected,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Severity</Text>
          <View style={styles.optionRow}>
            {SEVERITY_LEVELS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.option, severity === s && styles.optionSelected]}
                onPress={() => setSeverity(s)}
              >
                <Text
                  style={[
                    styles.optionText,
                    severity === s && styles.optionTextSelected,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="What happened?"
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
      </View>
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
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 4 },
  coords: { color: "#888", marginBottom: 16, fontSize: 12 },
  label: { fontWeight: "600", marginBottom: 8, marginTop: 12 },
  optionRow: { flexDirection: "row", marginBottom: 4 },
  option: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  optionSelected: { backgroundColor: "#e74c3c", borderColor: "#e74c3c" },
  optionText: { color: "#333" },
  optionTextSelected: { color: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
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
    borderColor: "#ccc",
    alignItems: "center",
  },
  cancelText: { color: "#333" },
  submitButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#e74c3c",
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "bold" },
});
