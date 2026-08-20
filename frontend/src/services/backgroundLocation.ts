import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import axios from "axios";
import { getDistanceKm } from "./distance";

export const BACKGROUND_LOCATION_TASK = "incident-reporter-background-location";
const API_URL = "http://192.168.129.124:3000";
const AUTH_TOKEN_KEY = "incident-reporter.auth-token";
const SETTINGS_KEY = "incident-reporter.settings";
const NOTIFIED_INCIDENTS_KEY = "incident-reporter.notified-incidents";

interface StoredSettings {
  notificationsEnabled: boolean;
  notificationDistance: number | null;
}

interface BackgroundIncident {
  id: number;
  lat: number;
  lon: number;
  type: string;
  address: string | null;
  createdAt: string;
}

const getStoredSettings = async (): Promise<StoredSettings> => {
  const rawSettings = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!rawSettings) {
    return { notificationsEnabled: true, notificationDistance: null };
  }

  return JSON.parse(rawSettings) as StoredSettings;
};

const getNotifiedIncidentIds = async (): Promise<number[]> => {
  const rawIds = await AsyncStorage.getItem(NOTIFIED_INCIDENTS_KEY);
  if (!rawIds) return [];
  return JSON.parse(rawIds) as number[];
};

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data) return;

  const { notificationsEnabled, notificationDistance } =
    await getStoredSettings();
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  if (!notificationsEnabled || !token) return;

  const locations = (data as { locations?: Location.LocationObject[] })
    .locations;
  const location = locations?.[locations.length - 1];
  if (!location) return;

  const speedKmh = Math.max((location.coords.speed ?? 0) * 3.6, 0);
  const automaticDistance = Math.max((speedKmh * 10) / 60, 1);
  const alertDistance = notificationDistance ?? automaticDistance;

  const response = await axios.get<BackgroundIncident[]>(
    `${API_URL}/incidents`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const notifiedIds = new Set(await getNotifiedIncidentIds());
  const nearbyIncidents = response.data.filter((incident) => {
    if (notifiedIds.has(incident.id)) return false;

    return (
      getDistanceKm(
        location.coords.latitude,
        location.coords.longitude,
        Number(incident.lat),
        Number(incident.lon),
      ) <= alertDistance
    );
  });

  for (const incident of nearbyIncidents) {
    const distance = getDistanceKm(
      location.coords.latitude,
      location.coords.longitude,
      Number(incident.lat),
      Number(incident.lon),
    );

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚨 New ${incident.type} nearby!`,
        body: `${incident.address || `${Number(incident.lat).toFixed(3)}, ${Number(incident.lon).toFixed(3)}`} · ${distance.toFixed(1)}km away`,
      },
      trigger: null,
    });
    notifiedIds.add(incident.id);
  }

  await AsyncStorage.setItem(
    NOTIFIED_INCIDENTS_KEY,
    JSON.stringify(Array.from(notifiedIds).slice(-500)),
  );
});

export const registerBackgroundLocation = async () => {
  if (Platform.OS === "web") return false;

  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== "granted") return false;

  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== "granted") return false;

  const alreadyRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_LOCATION_TASK,
  );
  if (!alreadyRegistered) {
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.LocationAccuracy.Balanced,
      timeInterval: 60000,
      distanceInterval: 100,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Incident Reporter is active",
        notificationBody: "Monitoring nearby incidents",
        notificationColor: "#247A78",
      },
    });
  }

  return true;
};

export const stopBackgroundLocation = async () => {
  if (Platform.OS === "web") return;

  const registered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_LOCATION_TASK,
  );
  if (registered) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
};
