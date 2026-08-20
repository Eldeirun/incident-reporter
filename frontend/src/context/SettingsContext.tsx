import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_KEY = "incident-reporter.settings";

interface SettingsContextType {
  notificationsEnabled: boolean;
  darkMode: boolean;
  notificationDistance: number | null;
  setNotificationsEnabled: (enabled: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
  setNotificationDistance: (distance: number | null) => void;
}

const SettingsContext = createContext<SettingsContextType>(
  {} as SettingsContextType,
);

export const SettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationDistance, setNotificationDistance] = useState<
    number | null
  >(null);

  useEffect(() => {
    void AsyncStorage.getItem(SETTINGS_KEY).then((stored) => {
      if (!stored) return;
      const settings = JSON.parse(stored) as Partial<{
        notificationsEnabled: boolean;
        darkMode: boolean;
        notificationDistance: number | null;
      }>;
      if (settings.notificationsEnabled !== undefined) {
        setNotificationsEnabled(settings.notificationsEnabled);
      }
      if (settings.darkMode !== undefined) setDarkMode(settings.darkMode);
      if (settings.notificationDistance !== undefined) {
        setNotificationDistance(settings.notificationDistance);
      }
    });
  }, []);

  const saveSettings = (settings: {
    notificationsEnabled: boolean;
    darkMode: boolean;
    notificationDistance: number | null;
  }) => void AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

  const updateNotificationsEnabled = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    saveSettings({
      notificationsEnabled: enabled,
      darkMode,
      notificationDistance,
    });
  };
  const updateDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    saveSettings({
      notificationsEnabled,
      darkMode: enabled,
      notificationDistance,
    });
  };
  const updateNotificationDistance = (distance: number | null) => {
    setNotificationDistance(distance);
    saveSettings({
      notificationsEnabled,
      darkMode,
      notificationDistance: distance,
    });
  };

  return (
    <SettingsContext.Provider
      value={{
        notificationsEnabled,
        darkMode,
        notificationDistance,
        setNotificationsEnabled: updateNotificationsEnabled,
        setDarkMode: updateDarkMode,
        setNotificationDistance: updateNotificationDistance,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
