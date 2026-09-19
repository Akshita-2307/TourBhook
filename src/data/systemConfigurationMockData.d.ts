export type ConfigurationCategory = "algorithm" | "ai" | "feature";
export type ConfigurationType = "decimal" | "integer" | "boolean";

export interface SystemConfigurationSetting {
  id: string;
  category: ConfigurationCategory;
  label: string;
  type: ConfigurationType;
  value: number | boolean;
  defaultValue: number | boolean;
  min?: number;
  max?: number;
  step?: number;
  description: string;
}

export interface ConfigurationAuditEntry {
  id: string;
  timestamp: string;
  parameter: string;
  oldValue: number | boolean;
  newValue: number | boolean;
  adminUser: string;
  reason: string;
}

export const systemConfigurationSettings: SystemConfigurationSetting[];
export const systemConfigurationAuditHistory: ConfigurationAuditEntry[];
