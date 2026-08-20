import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { connectSocket, getSocket } from "../services/socket";
import api from "../services/api";
import { useAuth } from "./AuthContext";
import { getDistanceKm } from "../services/distance";
import {
  requestNotificationPermission,
  sendLocalNotification,
} from "../services/notifications";
import * as Location from "expo-location";
import { useSettings } from "./SettingsContext";
import {
  registerBackgroundLocation,
  stopBackgroundLocation,
} from "../services/backgroundLocation";

export interface Incident {
  id: number;
  lat: number;
  lon: number;
  type: string;
  severity: string;
  description: string | null;
  image: string | null;
  address: string | null;
  reportCount: number;
  resolveCount: number;
  reportedBy: { id: number; username: string; profile_image: string | null };
  createdAt: string;
}

interface IncidentsContextType {
  incidents: Incident[];
  isLoading: boolean;
  removeIncident: (id: number) => void;
  resolveIncident: (id: number) => void;
}

const IncidentsContext = createContext<IncidentsContextType>(
  {} as IncidentsContextType,
);

export const IncidentsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();
  const { notificationsEnabled, notificationDistance } = useSettings();
  const settingsRef = useRef({ notificationsEnabled, notificationDistance });
  const userLocation = useRef<{
    latitude: number;
    longitude: number;
    speed: number;
  } | null>(null);

  settingsRef.current = { notificationsEnabled, notificationDistance };

  useEffect(() => {
    if (notificationsEnabled) requestNotificationPermission();

    if (!token || !notificationsEnabled) {
      void stopBackgroundLocation();
      return;
    }

    void registerBackgroundLocation().catch((err) =>
      console.error("Failed to register background location", err),
    );
  }, [notificationsEnabled, token]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      await Location.watchPositionAsync(
        {
          accuracy: Location.LocationAccuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (loc: Location.LocationObject) => {
          userLocation.current = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            speed: (loc.coords.speed ?? 0) * 3.6, //convert from m/s to km/h
          };
        },
      );
    })();

    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    api
      .get("/incidents")
      .then((res) => setIncidents(res.data))
      .catch((err) => console.error("Failed to load incidents", err))
      .finally(() => setIsLoading(false));

    const socket = connectSocket();

    socket.on("newIncident", (incident: Incident) => {
      setIncidents((prev) => [...prev, incident]);

      const loc = userLocation.current;
      if (loc) {
        const speedKmh = loc.speed ?? 0;
        const NOTIFICATION_MINUTES = 10;
        const automaticDistance = Math.max(
          (speedKmh * NOTIFICATION_MINUTES) / 60,
          1,
        );
        const { notificationsEnabled, notificationDistance } =
          settingsRef.current;
        const alertDistance = notificationDistance ?? automaticDistance;
        const distance = getDistanceKm(
          loc.latitude,
          loc.longitude,
          Number(incident.lat),
          Number(incident.lon),
        );
        if (notificationsEnabled && distance <= alertDistance) {
          sendLocalNotification(
            `🚨 New ${incident.type} nearby!`,
            `${incident.address || `${Number(incident.lat).toFixed(3)}, ${Number(incident.lon).toFixed(3)}`} · ${distance.toFixed(1)}km away`,
          );
        }
      }
    });

    socket.on("removeIncident", (id: number) => {
      setIncidents((prev) => prev.filter((i) => i.id !== Number(id)));
    });

    socket.on(
      "resolveVote",
      ({
        incidentId,
        resolveCount,
      }: {
        incidentId: number;
        resolveCount: number;
      }) => {
        setIncidents((prev) =>
          prev.map((i) =>
            i.id === Number(incidentId) ? { ...i, resolveCount } : i,
          ),
        );
      },
    );

    socket.on(
      "reportCount",
      ({
        incidentId,
        reportCount,
      }: {
        incidentId: number;
        reportCount: number;
      }) => {
        setIncidents((prev) =>
          prev.map((i) =>
            i.id === Number(incidentId) ? { ...i, reportCount } : i,
          ),
        );
      },
    );

    return () => {
      getSocket()?.disconnect();
    };
  }, [token]);

  const removeIncident = async (id: number) => {
    try {
      await api.delete(`/incidents/${id}`);
      setIncidents((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Failed to remove incident", err);
    }
  };

  const resolveIncident = async (id: number) => {
    try {
      await api.post(`/incidents/${id}/resolve`);
    } catch (err) {
      console.error("Failed to resolve incident", err);
    }
  };

  return (
    <IncidentsContext.Provider
      value={{ incidents, isLoading, removeIncident, resolveIncident }}
    >
      {children}
    </IncidentsContext.Provider>
  );
};

export const useIncidents = () => useContext(IncidentsContext);
