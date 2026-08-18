import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import MapView, { Marker, MapPressEvent, UrlTile } from "react-native-maps";
import IncidentFormModal from "../components/IncidentFormModal";
import api from "../services/api";

export default function MapScreen() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    setLocation({ latitude: 39.9334, longitude: 32.8597 });
  }, []);

  const handleMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    console.log("Pressed:", latitude, longitude);
  };

  const handleSubmit = async (data: any) => {
    try {
      await api.post("/incidents", data);
    } catch (err) {
      console.error("Failed to submit incident", err);
    }
  };

  if (!location) return null;

  return (
    <View style={styles.container}>
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
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          tileSize={256}
        />
      </MapView>
      {selectedCoords && (
        <IncidentFormModal
          visible={modalVisible}
          latitude={selectedCoords.latitude}
          longitude={selectedCoords.longitude}
          onClose={() => setModalVisible(false)}
          onSubmit={handleSubmit}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
