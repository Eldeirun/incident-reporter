import React, { createContext, useState, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { stopBackgroundLocation } from "../services/backgroundLocation";
import { setAuthToken } from "../services/api";

const AUTH_TOKEN_KEY = "incident-reporter.auth-token";

interface AuthContextType {
  token: string | null;
  user: any | null;
  loginUser: (token: string, user: any) => void;
  logoutUser: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);

  const loginUser = (token: string, user: any) => {
    setToken(token);
    setUser(user);
    setAuthToken(token);
    void AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  };

  const logoutUser = () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    void AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    void stopBackgroundLocation();
  };

  return (
    <AuthContext.Provider value={{ token, user, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
