import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

type AdminIncident = {
  id: number;
  type: string;
  description: string | null;
  address: string | null;
  resolveCount: number;
  status: "active" | "resolved";
};

export default function AdminScreen() {
  const { logoutUser } = useAuth();
  const [incidents, setIncidents] = useState<AdminIncident[]>([]);
  const [view, setView] = useState<"active" | "resolved">("active");

  const loadIncidents = useCallback(async () => {
    try {
      const response = await api.get<AdminIncident[]>("/incidents/admin");
      setIncidents(response.data);
    } catch {
      Alert.alert("Error", "Resolved incidents could not be loaded");
    }
  }, []);

  useEffect(() => {
    void loadIncidents();
  }, [loadIncidents]);

  const removeDescription = async (id: number) => {
    try {
      await api.patch(`/incidents/${id}/description`);
      setIncidents((current) =>
        current.map((incident) =>
          incident.id === id ? { ...incident, description: null } : incident,
        ),
      );
    } catch {
      Alert.alert("Error", "Description could not be removed");
    }
  };

  const visibleIncidents = incidents.filter(
    (incident) => incident.status === view,
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Incident administration</Text>
        <TouchableOpacity onPress={logoutUser}>
          <Text style={styles.logout}>Log out</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, view === "active" && styles.selectedTab]}
          onPress={() => setView("active")}
        >
          <Text
            style={[
              styles.tabText,
              view === "active" && styles.selectedTabText,
            ]}
          >
            Current (
            {
              incidents.filter((incident) => incident.status === "active")
                .length
            }
            )
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, view === "resolved" && styles.selectedTab]}
          onPress={() => setView("resolved")}
        >
          <Text
            style={[
              styles.tabText,
              view === "resolved" && styles.selectedTabText,
            ]}
          >
            Resolved (
            {
              incidents.filter((incident) => incident.status === "resolved")
                .length
            }
            )
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={visibleIncidents}
        keyExtractor={(incident) => incident.id.toString()}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <Text style={styles.empty}>No {view} incidents</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.type}>{item.type}</Text>
            <Text style={styles.status}>{item.status.toUpperCase()}</Text>
            <Text style={styles.meta}>
              {item.address ?? "Location unavailable"}
            </Text>
            <Text style={styles.description}>
              {item.description ?? "Description removed"}
            </Text>
            <Text style={styles.meta}>
              Resolved by {item.resolveCount} vote(s)
            </Text>
            {item.description && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => void removeDescription(item.id)}
              >
                <Text style={styles.removeText}>Remove description</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F6F5" },
  header: {
    paddingTop: 52,
    paddingHorizontal: 18,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { color: "#173B3A", fontSize: 21, fontWeight: "800" },
  logout: { color: "#D86658", fontWeight: "700" },
  content: { padding: 16 },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#DCE8E5",
    borderBottomWidth: 1,
  },
  tab: { flex: 1, padding: 13, alignItems: "center" },
  selectedTab: { borderBottomColor: "#247A78", borderBottomWidth: 3 },
  tabText: { color: "#6B7E7C", fontWeight: "700" },
  selectedTabText: { color: "#247A78" },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DCE8E5",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  type: { color: "#173B3A", fontSize: 17, fontWeight: "800", marginBottom: 6 },
  status: {
    color: "#247A78",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 6,
  },
  meta: { color: "#6B7E7C", fontSize: 12, marginBottom: 6 },
  description: { color: "#173B3A", lineHeight: 20, marginBottom: 6 },
  removeButton: {
    alignSelf: "flex-start",
    backgroundColor: "#FBE8E4",
    borderRadius: 7,
    padding: 9,
    marginTop: 6,
  },
  removeText: { color: "#D86658", fontWeight: "800" },
  empty: { textAlign: "center", color: "#6B7E7C", marginTop: 48 },
});
