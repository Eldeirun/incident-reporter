import React, { useEffect, useState } from "react";
import * as Location from "expo-location";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, UrlTile, MapPressEvent } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import IncidentFormModal from "../components/IncidentFormModal";
import api from "../services/api";
import { useIncidents, Incident } from "../context/IncidentsContext";
import { useSettings } from "../context/SettingsContext";

const palette = {
  ink: "#173B3A",
  muted: "#6B7E7C",
  softMuted: "#8EA09D",
  canvas: "#F2F6F5",
  surface: "#FFFFFF",
  line: "#DCE8E5",
  teal: "#247A78",
  tealSoft: "#E4F1EF",
  coral: "#D86658",
  coralSoft: "#FBE8E4",
  amber: "#C89432",
  amberSoft: "#FFF3D9",
  severe: "#725A76",
  severeSoft: "#F0EAF1",
};

const darkPalette = {
  ...palette,
  ink: "#EAF4F1",
  muted: "#A8BFBB",
  softMuted: "#7F9D98",
  canvas: "#122322",
  surface: "#1C3230",
  line: "#31504C",
  teal: "#67C1B5",
  tealSoft: "#244844",
  coralSoft: "#4B2B29",
};

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedCoords, setSelectedCoords] = useState({
    latitude: 39.9334,
    longitude: 32.8597,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const { incidents, isLoading, resolveIncident } = useIncidents();
  const { darkMode } = useSettings();
  const theme = darkMode ? darkPalette : palette;
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null,
  );

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setSelectedCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);

  const handleMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setSelectedCoords({ latitude, longitude });
    setModalVisible(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      await api.post("/incidents", data);
    } catch (err) {
      console.error("Failed to submit incident", err);
    }
  };

  const handleReport = async (id: number) => {
    setSelectedIncident((current) =>
      current?.id === id
        ? { ...current, reportCount: current.reportCount + 1 }
        : current,
    );

    try {
      const response = await api.post(`/incidents/${id}/report`);
      setSelectedIncident((current) =>
        current?.id === id
          ? { ...current, reportCount: response.data.reportCount }
          : current,
      );
    } catch (err) {
      setSelectedIncident((current) =>
        current?.id === id
          ? { ...current, reportCount: Math.max(0, current.reportCount - 1) }
          : current,
      );
      console.error("Failed to report incident", err);
    }
  };

  const getMarkerColor = (severity: string) => {
    switch (severity) {
      case "High":
        return palette.coral;
      case "Severe":
        return palette.severe;
      case "Medium":
        return palette.amber;
      default:
        return palette.teal;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.canvas }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.line },
        ]}
      >
        <Text style={[styles.title, { color: theme.ink }]}>
          Active Incidents
        </Text>
        <View
          style={[
            styles.toggle,
            { backgroundColor: theme.canvas, borderColor: theme.line },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              viewMode === "map" && styles.toggleActive,
            ]}
            onPress={() => setViewMode("map")}
          >
            <Text
              style={[
                styles.toggleText,
                { color: theme.muted },
                viewMode === "map" && styles.toggleTextActive,
              ]}
            >
              🗺 Map
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              viewMode === "list" && styles.toggleActive,
            ]}
            onPress={() => setViewMode("list")}
          >
            <Text
              style={[
                styles.toggleText,
                { color: theme.muted },
                viewMode === "list" && styles.toggleTextActive,
              ]}
            >
              📋 List
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: theme.tealSoft }]}
          onPress={() => navigation.navigate("Settings")}
          accessibilityLabel="Open settings"
        >
          <Text style={[styles.settingsText, { color: theme.teal }]}>⚙</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.teal} />
          <Text style={[styles.loadingText, { color: theme.muted }]}>
            Loading incidents...
          </Text>
        </View>
      )}

      {/* Map View */}
      {!isLoading && viewMode === "map" && location && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            mapType="none"
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            onPress={handleMapPress}
            showsUserLocation
          >
            <UrlTile
              urlTemplate="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}.png"
              maximumZ={19}
              tileSize={256}
            />
            {incidents.map((incident) => (
              <Marker
                key={incident.id}
                coordinate={{
                  latitude: Number(incident.lat),
                  longitude: Number(incident.lon),
                }}
                onPress={() => setSelectedIncident(incident)}
              >
                <View
                  style={[
                    styles.marker,
                    { backgroundColor: getMarkerColor(incident.severity) },
                  ]}
                >
                  <View style={styles.markerCore} />
                </View>
              </Marker>
            ))}
          </MapView>
          {selectedIncident && (
            <View
              style={[styles.bottomSheet, darkMode && styles.bottomSheetDark]}
            >
              <View style={styles.bottomSheetHeader}>
                <Text
                  style={[styles.bottomSheetType, darkMode && styles.darkText]}
                >
                  {selectedIncident.type}
                </Text>
                <Text
                  style={[
                    styles.bottomSheetSeverity,
                    darkMode && styles.darkCoralText,
                  ]}
                >
                  {selectedIncident.severity}
                </Text>
                <TouchableOpacity onPress={() => setSelectedIncident(null)}>
                  <Text
                    style={[
                      styles.bottomSheetClose,
                      darkMode && styles.darkMutedText,
                    ]}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>
              {selectedIncident.address && (
                <Text
                  style={[
                    styles.bottomSheetAddress,
                    darkMode && styles.darkMutedText,
                  ]}
                >
                  {selectedIncident.address}
                </Text>
              )}
              {selectedIncident.description && (
                <Text
                  style={[styles.bottomSheetDesc, darkMode && styles.darkText]}
                >
                  {selectedIncident.description}
                </Text>
              )}
              <Text
                style={[
                  styles.bottomSheetMeta,
                  darkMode && styles.darkMutedText,
                ]}
              >
                👤 {selectedIncident.reportedBy?.username}
              </Text>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.yeahButton}
                  onPress={() => handleReport(selectedIncident.id)}
                >
                  <Text style={styles.yeahText}>
                    👍 Yeah ({selectedIncident.reportCount})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.resolveButton}
                  onPress={() =>
                    Alert.alert("Mark Resolved", "Is this incident resolved?", [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Resolved",
                        onPress: () => {
                          resolveIncident(selectedIncident.id);
                          setSelectedIncident(null);
                        },
                      },
                    ])
                  }
                >
                  <Text style={styles.resolveText}>
                    ✅ Resolved ({selectedIncident.resolveCount}/3)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.reportButtonText}>+ Report Incident</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List View */}
      {!isLoading && viewMode === "list" && (
        <View style={styles.listContainer}>
          <FlatList
            data={incidents}
            keyExtractor={(item) => item.id.toString()}
            style={styles.list}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.surface, borderColor: theme.line },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardType, { color: theme.ink }]}>
                    {item.type}
                  </Text>
                  <Text style={[styles.cardSeverity, { color: theme.ink }]}>
                    {item.severity}
                  </Text>
                </View>
                {item.description && (
                  <Text style={[styles.cardDesc, { color: theme.ink }]}>
                    {item.description}
                  </Text>
                )}
                {item.address && (
                  <Text style={[styles.cardAddress, { color: theme.ink }]}>
                    {item.address}
                  </Text>
                )}
                <Text style={[styles.cardMeta, { color: theme.ink }]}>
                  👤 {item.reportedBy?.username} · 📍{" "}
                  {Number(item.lat).toFixed(3)}, {Number(item.lon).toFixed(3)}
                </Text>
                <Text style={[styles.cardCount, { color: theme.ink }]}>
                  🚨 {item.reportCount} report(s)
                </Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.yeahButton}
                    onPress={() => api.post(`/incidents/${item.id}/report`)}
                  >
                    <Text style={styles.yeahText}>
                      👍 Yeah ({item.reportCount})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.resolveButton}
                    onPress={() =>
                      Alert.alert(
                        "Mark Resolved",
                        "Is this incident resolved?",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Resolved",
                            onPress: () => resolveIncident(item.id),
                          },
                        ],
                      )
                    }
                  >
                    <Text style={styles.resolveText}>
                      ✅ Resolved ({item.resolveCount}/3)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: theme.ink }]}>
                No active incidents
              </Text>
            }
          />
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.reportButtonText}>+ Report Incident</Text>
          </TouchableOpacity>
        </View>
      )}

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
  container: { flex: 1, backgroundColor: palette.canvas },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: palette.muted, fontSize: 15 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  title: { color: palette.ink, fontSize: 21, fontWeight: "800" },
  toggle: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.line,
    overflow: "hidden",
    backgroundColor: palette.canvas,
  },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 7 },
  toggleActive: { backgroundColor: palette.teal },
  toggleText: { color: palette.muted, fontWeight: "700" },
  toggleTextActive: { color: palette.surface },
  settingsButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsText: { fontSize: 20, fontWeight: "700" },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  listContainer: { flex: 1 },
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: 10,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardType: { color: palette.ink, fontWeight: "800", fontSize: 16 },
  cardSeverity: { color: palette.coral, fontWeight: "800" },
  cardDesc: { color: palette.ink, marginBottom: 6, lineHeight: 20 },
  cardAddress: {
    color: palette.muted,
    fontSize: 11,
    marginBottom: 4,
    fontStyle: "italic",
  },
  cardMeta: { color: palette.softMuted, fontSize: 12, marginBottom: 4 },
  cardCount: { color: palette.coral, fontSize: 12, marginBottom: 8 },
  empty: { textAlign: "center", color: palette.softMuted, marginTop: 48 },
  reportButton: {
    margin: 16,
    backgroundColor: palette.coral,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: palette.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  reportButtonText: { color: palette.surface, fontWeight: "800", fontSize: 16 },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 8,
  },
  yeahButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    backgroundColor: palette.tealSoft,
    borderWidth: 1,
    borderColor: "#A9D4CF",
    alignItems: "center",
  },
  yeahText: { color: palette.teal, fontWeight: "800", fontSize: 12 },
  resolveButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    backgroundColor: palette.coralSoft,
    borderWidth: 1,
    borderColor: "#F0B4AB",
    alignItems: "center",
  },
  resolveText: { color: palette.coral, fontWeight: "800", fontSize: 12 },
  marker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderColor: palette.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.24,
    shadowRadius: 4,
    elevation: 5,
  },
  markerCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.surface,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 90,
    left: 16,
    right: 16,
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomSheetDark: {
    backgroundColor: darkPalette.surface,
    borderColor: darkPalette.line,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  bottomSheetType: {
    color: palette.ink,
    fontWeight: "800",
    fontSize: 16,
    flex: 1,
  },
  bottomSheetSeverity: {
    color: palette.coral,
    fontWeight: "800",
    marginRight: 8,
  },
  bottomSheetClose: { fontSize: 16, color: palette.muted },
  bottomSheetAddress: {
    color: palette.muted,
    fontSize: 11,
    fontStyle: "italic",
    marginBottom: 4,
  },
  bottomSheetDesc: { color: palette.ink, marginBottom: 6, lineHeight: 20 },
  bottomSheetMeta: { color: palette.softMuted, fontSize: 12, marginBottom: 8 },
  darkText: { color: darkPalette.ink },
  darkMutedText: { color: darkPalette.muted },
  darkCoralText: { color: "#F19A8D" },
});
