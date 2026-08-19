import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  Alert,
} from "react-native";
import IncidentFormModal from "../components/IncidentFormModal";
import api from "../services/api";
import { useIncidents } from "../context/IncidentsContext";

export default function MapScreen() {
  const [selectedCoords] = useState({ latitude: 39.9334, longitude: 32.8597 });
  const [modalVisible, setModalVisible] = useState(false);
  const { incidents, removeIncident } = useIncidents();

  const handleSubmit = async (data: any) => {
    try {
      await api.post("/incidents", data);
      console.log("Incident submitted!");
    } catch (err) {
      console.error("Failed to submit incident", err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Active Incidents</Text>

      <FlatList
        data={incidents}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardType}>{item.type}</Text>
              <Text style={styles.cardSeverity}>{item.severity}</Text>
            </View>
            {item.description && (
              <Text style={styles.cardDesc}>{item.description}</Text>
            )}
            <Text style={styles.cardMeta}>
              👤 {item.reportedBy?.username} · 📍 {Number(item.lat).toFixed(3)},{" "}
              {Number(item.lon).toFixed(3)}
            </Text>
            <Text style={styles.cardCount}>
              🚨 {item.reportCount} report(s)
            </Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() =>
                Alert.alert(
                  "Resolve Incident",
                  "Mark this incident as resolved?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Resolve",
                      style: "destructive",
                      onPress: () => removeIncident(item.id),
                    },
                  ],
                )
              }
            >
              <Text style={styles.removeText}>Mark Resolved</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No active incidents</Text>
        }
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>+ Report Incident</Text>
      </TouchableOpacity>

      <IncidentFormModal
        visible={modalVisible}
        latitude={selectedCoords.latitude}
        longitude={selectedCoords.longitude}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", paddingTop: 48 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  list: { flex: 1, paddingHorizontal: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardType: { fontWeight: "bold", fontSize: 16 },
  cardSeverity: { color: "#e74c3c", fontWeight: "600" },
  cardDesc: { color: "#555", marginBottom: 6 },
  cardMeta: { color: "#888", fontSize: 12, marginBottom: 4 },
  cardCount: { color: "#e74c3c", fontSize: 12, marginBottom: 8 },
  removeButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#fee",
    borderWidth: 1,
    borderColor: "#e74c3c",
  },
  removeText: { color: "#e74c3c", fontSize: 12, fontWeight: "600" },
  empty: { textAlign: "center", color: "#aaa", marginTop: 48 },
  button: {
    margin: 16,
    backgroundColor: "#e74c3c",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
