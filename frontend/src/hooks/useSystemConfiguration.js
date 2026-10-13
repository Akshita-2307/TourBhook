import { useEffect, useState } from "react";
import {
  systemConfigurationAuditHistory,
  systemConfigurationSettings,
} from "../data/systemConfigurationMockData";

export function useSystemConfiguration() {
  const [settings, setSettings] = useState(() =>
      systemConfigurationSettings.map((setting) => ({ ...setting })),
  );
  const [auditHistory, setAuditHistory] = useState(() =>
      systemConfigurationAuditHistory.map((entry) => ({ ...entry })),
  );
  const [pendingChange, setPendingChange] = useState(null);

  // Fetch live system configuration settings and audit history from Spring Boot backend on mount
  useEffect(() => {
    Promise.all([
      fetch("http://localhost:8080/api/system/config", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("admin_token") || ""}`,
          "Content-Type": "application/json"
        }
      }).then((res) => res.json()),
      fetch("http://localhost:8080/api/system/history", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("admin_token") || ""}`,
          "Content-Type": "application/json"
        }
      }).then((res) => res.json())
    ])
        .then(([configData, historyData]) => {
          if (configData && configData.success && configData.settings) {
            setSettings(configData.settings.map((setting) => ({ ...setting })));
          }
          if (historyData && historyData.success && historyData.history) {
            setAuditHistory(historyData.history.map((entry) => ({ ...entry })));
          }
        })
        .catch((err) => {
          console.warn("Failed to fetch live system configurations from backend, using local mock data fallback:", err);
        });
  }, []);

  const requestChange = (settingId, newValue) => {
    const setting = settings.find((item) => item.id === settingId);
    if (!setting || setting.value === newValue) return;
    setPendingChange({ setting, oldValue: setting.value, newValue });
  };

  const cancelChange = () => setPendingChange(null);

  const saveChange = (reason) => {
    if (!pendingChange) return;

    const configKey = pendingChange.setting.id;
    const configValue = pendingChange.newValue;

    // Send update to Spring Boot backend API
    fetch("http://localhost:8080/api/system/config/update", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("admin_token") || ""}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ configKey, configValue, reason: reason.trim() || "No reason provided." })
    })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success) {
            const timestamp = new Date().toISOString();
            const entry = {
              id: `audit-${timestamp}`,
              timestamp,
              parameter: configKey,
              oldValue: pendingChange.oldValue,
              newValue: configValue,
              adminUser: "Akshita Pandey",
              reason: reason.trim() || "No reason provided.",
            };

            setSettings((current) =>
                current.map((setting) =>
                    setting.id === configKey
                        ? { ...setting, value: configValue }
                        : setting,
                ),
            );
            setAuditHistory((current) => [entry, ...current]);
            setPendingChange(null);
          } else {
            console.error("Backend update failed:", data.error);
          }
        })
        .catch((err) => {
          console.error("Network error while updating configuration on backend:", err);
        });
  };

  return {
    settings,
    auditHistory,
    pendingChange,
    requestChange,
    cancelChange,
    saveChange,
  };
}