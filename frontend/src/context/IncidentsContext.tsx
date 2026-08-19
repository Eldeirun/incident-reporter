import React, { createContext, useContext, useEffect, useState } from "react";
import { connectSocket, getSocket } from "../services/socket";
import api from "../services/api";
import { useAuth } from "./AuthContext";

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
  reportedBy: { id: number; username: string; profile_image: string | null };
  createdAt: string;
}

interface IncidentsContextType {
  incidents: Incident[];
  removeIncident: (id: number) => void;
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
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    api.get("/incidents").then((res) => setIncidents(res.data));

    const socket = connectSocket();

    socket.on("newIncident", (incident: Incident) => {
      setIncidents((prev) => [...prev, incident]);
    });

    socket.on("removeIncident", (id: number) => {
      setIncidents((prev) => prev.filter((i) => i.id !== id));
    });

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

  return (
    <IncidentsContext.Provider value={{ incidents, removeIncident }}>
      {children}
    </IncidentsContext.Provider>
  );
};

export const useIncidents = () => useContext(IncidentsContext);
