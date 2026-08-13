import React, { createContext, useState, useContext } from "react";
import { setAuthToken } from "../services/api";

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
};
