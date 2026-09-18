import { useState } from "react";
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

  const requestChange = (settingId, newValue) => {
    const setting = settings.find((item) => item.id === settingId);
    if (!setting || setting.value === newValue) return;
    setPendingChange({ setting, oldValue: setting.value, newValue });
  };

  const cancelChange = () => setPendingChange(null);

  const saveChange = (reason) => {
    if (!pendingChange) return;
    const timestamp = new Date().toISOString();
    const entry = {
      id: `audit-${timestamp}`,
      timestamp,
      parameter: pendingChange.setting.id,
      oldValue: pendingChange.oldValue,
      newValue: pendingChange.newValue,
      adminUser: "Akshita Pandey",
      reason: reason.trim() || "No reason provided.",
    };

    setSettings((current) =>
      current.map((setting) =>
        setting.id === pendingChange.setting.id
          ? { ...setting, value: pendingChange.newValue }
          : setting,
      ),
    );
    setAuditHistory((current) => [entry, ...current]);
    setPendingChange(null);
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
