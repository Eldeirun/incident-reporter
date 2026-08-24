import axios from "axios";

const API_URL = "http://192.168.1.198:3000";

const api = axios.create({
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

export default api;
