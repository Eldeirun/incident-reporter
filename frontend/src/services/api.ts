import { create } from "axios";

const API_URL = "http://172.17.154.124:3000";

const api = create({
  baseURL: API_URL,
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export const register = (username: string, password: string) =>
  api.post("/auth/register", { username, password });

export const login = (username: string, password: string) =>
  api.post("/auth/login", { username, password });

export const adminLogin = (username: string, password: string) =>
  api.post("/auth/admin-login", { username, password });

export interface AnalyticsInsights {
  generatedAt: string;
  metrics: {
    activeIncidents: number;
    resolvedToday: number;
    averageResponseMinutes: number | null;
    topLocation: { name: string; count: number } | null;
    mostReported: { type: string; count: number } | null;
    longestRunning: { type: string; ageMinutes: number } | null;
    highestPriority: {
      type: string;
      severity: string;
      address: string | null;
    } | null;
  };
  insight: {
    headline: string;
    summary: string;
    priorities: string[];
    patterns: string[];
    recommendations: string[];
  };
}

export const getAnalyticsInsights = () =>
  api.get<AnalyticsInsights>("/analytics/insights");

export default api;
