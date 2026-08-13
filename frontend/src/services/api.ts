import axios from "axios";

const API_URL = "http://10.75.59.124:3000";

const api = axios.create({
  baseURL: API_URL,
});

export const setAuthToken = (token: string) => {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

export const register = (username: string, password: string) =>
  api.post("/auth/register", { username, password });

export const login = (username: string, password: string) =>
  api.post("/auth/login", { username, password });

export default api;
