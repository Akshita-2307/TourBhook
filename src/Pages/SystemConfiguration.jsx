import { useEffect, useState } from "react";
import { useSystemConfiguration } from "../hooks/useSystemConfiguration";
import "./SystemConfiguration.css";

const configurationGroups = [
  {
    id: "algorithm",
    title: "Algorithm & Weights",
    description: "Configure search and recommendation algorithm parameters.",
  },
  {
    id: "ai",
    title: "AI Thresholds",
    description: "Configure AI processing and content generation thresholds.",
  },
  {
    id: "feature",
    title: "Feature Flags",
    description: "Enable or disable platform features.",
  },
];

function formatValue(value, type, step) {
  if (type === "boolean") return value ? "Enabled" : "Disabled";
  if (type === "decimal") {
    return Number(value).toFixed(step === 0.01 ? 2 : 1);
  }
  return String(value);
}

function formatTimestamp(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function SaveConfigurationModal({ change, onCancel, onSave }) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onCancel]);

  if (!change) return null;

  return (
    <div className="configuration-modal-backdrop" role="presentation">
      <section
        className="configuration-save-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-configuration-title"
      >
        <div className="configuration-modal-heading">
          <span>Configuration change</span>
          <h2 id="save-configuration-title">Save Configuration</h2>
        </div>
        <div className="configuration-change-summary">
          <strong>{change.setting.label}</strong>
          <code>{change.setting.id}</code>
          <div>
            <span className="configuration-old-value">
              {formatValue(
                change.oldValue,
                change.setting.type,
                change.setting.step,
              )}
            </span>
            <span aria-hidden="true">→</span>
            <span className="configuration-new-value">
              {formatValue(
                change.newValue,
                change.setting.type,
                change.setting.step,
              )}
            </span>
          </div>
        </div>
        <label className="configuration-reason">
          <span>Reason for change <em>(optional)</em></span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Add context for this change..."
          />
        </label>
        <div className="configuration-modal-actions">
          <button className="configuration-cancel" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="configuration-confirm" type="button" onClick={() => onSave(reason)}>
            Save Change
          </button>
        </div>
      </section>
    </div>
  );
}

function NumericSetting({ setting, draftValue, onDraftChange, onSave }) {
  const parsedValue = Number(draftValue);
  const isInvalid =
    !Number.isFinite(parsedValue) ||
    parsedValue < setting.min ||
    parsedValue > setting.max;
  const hasChanged = !isInvalid && parsedValue !== setting.value;

  return (
    <div className="configuration-row">
      <div className="configuration-row-copy">
        <strong>{setting.label}</strong>
        <span>{setting.description}</span>
      </div>
      <div className="configuration-value-field">
        <input
          type="number"
          value={draftValue}
          min={setting.min}
          max={setting.max}
          step={setting.step}
          onChange={(event) => onDraftChange(setting.id, event.target.value)}
          aria-label={setting.label}
        />
        <small>Default: {formatValue(setting.defaultValue, setting.type, setting.step)}</small>
      </div>
      <span className={`configuration-range${isInvalid ? " is-invalid" : ""}`}>
        {isInvalid
          ? `Enter a value from ${setting.min} to ${setting.max}`
          : `Range: ${formatValue(setting.min, setting.type, setting.step)} – ${formatValue(setting.max, setting.type, setting.step)}`}
      </span>
      <button
        className="configuration-save-button"
        type="button"
        onClick={() => onSave(setting, parsedValue)}
        disabled={!hasChanged}
      >
        Save
      </button>
    </div>
  );
}

function FeatureSetting({ setting, onChange }) {
  return (
    <div className="configuration-row configuration-feature-row">
      <div className="configuration-row-copy">
        <strong>{setting.label}</strong>
        <span>{setting.description}</span>
      </div>
      <button
        className={`configuration-toggle${setting.value ? " is-enabled" : ""}`}
        type="button"
        role="switch"
        aria-checked={setting.value}
        aria-label={`Toggle ${setting.label}`}
        onClick={() => onChange(setting, !setting.value)}
      >
        <span />
      </button>
      <span className="configuration-feature-state">
        {setting.value ? "Enabled" : "Disabled"}
      </span>
      <span className="configuration-default-state">
        Default: {String(setting.defaultValue)}
      </span>
    </div>
  );
}

function ConfigurationGroup({ group, settings, drafts, onDraftChange, onSave }) {
  const groupSettings = settings.filter((setting) => setting.category === group.id);

  return (
    <section className="configuration-group">
      <header>
        <h2>{group.title}</h2>
        <p>{group.description}</p>
      </header>
      <div className="configuration-group-body">
        {groupSettings.map((setting) =>
          setting.type === "boolean" ? (
            <FeatureSetting setting={setting} onChange={onSave} key={setting.id} />
          ) : (
            <NumericSetting
              setting={setting}
              draftValue={drafts[setting.id]}
              onDraftChange={onDraftChange}
              onSave={onSave}
              key={setting.id}
            />
          ),
        )}
      </div>
    </section>
  );
}

function ChangeHistory({ entries }) {
  return (
    <section className="configuration-history-card">
      <div className="configuration-history-heading">
        <h2>Change History</h2>
        <p>Recent configuration changes made by administrators.</p>
      </div>
      <div className="configuration-history-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Timestamp</th>
              <th scope="col">Parameter Changed</th>
              <th scope="col">Old Value</th>
              <th scope="col">New Value</th>
              <th scope="col">Admin User</th>
              <th scope="col">Reason</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{formatTimestamp(entry.timestamp)}</td>
                <td><code>{entry.parameter}</code></td>
                <td><span className="configuration-old-value">{String(entry.oldValue)}</span></td>
                <td><span className="configuration-new-value">{String(entry.newValue)}</span></td>
                <td>{entry.adminUser}</td>
                <td>{entry.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SystemConfiguration() {
  const configuration = useSystemConfiguration();
  const [activeTab, setActiveTab] = useState("settings");
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(
      configuration.settings
        .filter((setting) => setting.type !== "boolean")
        .map((setting) => [
          setting.id,
          formatValue(setting.value, setting.type, setting.step),
        ]),
    ),
  );

  const updateDraft = (settingId, value) => {
    setDrafts((current) => ({ ...current, [settingId]: value }));
  };

  const requestNumericChange = (setting, newValue) => {
    configuration.requestChange(setting.id, newValue);
  };

  const cancelChange = () => {
    if (configuration.pendingChange?.setting.type !== "boolean") {
      setDrafts((current) => ({
        ...current,
        [configuration.pendingChange.setting.id]: formatValue(
          configuration.pendingChange.oldValue,
          configuration.pendingChange.setting.type,
          configuration.pendingChange.setting.step,
        ),
      }));
    }
    configuration.cancelChange();
  };

  const saveChange = (reason) => {
    const change = configuration.pendingChange;
    configuration.saveChange(reason);
    if (change?.setting.type !== "boolean") {
      setDrafts((current) => ({
        ...current,
        [change.setting.id]: formatValue(
          change.newValue,
          change.setting.type,
          change.setting.step,
        ),
      }));
    }
  };

  return (
    <main className="system-configuration-content">
      <header className="system-configuration-header">
        <h1>System Configuration</h1>
        <p>
          Manage platform-wide settings and feature behavior. Changes take effect in real time without a redeploy.
        </p>
      </header>

      <div className="system-configuration-tabs" role="tablist" aria-label="System configuration sections">
        <button
          className={activeTab === "settings" ? "is-active" : ""}
          type="button"
          role="tab"
          aria-selected={activeTab === "settings"}
          onClick={() => setActiveTab("settings")}
        >
          Configuration Settings
        </button>
        <button
          className={activeTab === "history" ? "is-active" : ""}
          type="button"
          role="tab"
          aria-selected={activeTab === "history"}
          onClick={() => setActiveTab("history")}
        >
          Change History
        </button>
      </div>

      {activeTab === "settings" ? (
        <div className="system-configuration-groups">
          {configurationGroups.map((group) => (
            <ConfigurationGroup
              group={group}
              settings={configuration.settings}
              drafts={drafts}
              onDraftChange={updateDraft}
              onSave={
                group.id === "feature"
                  ? (setting, value) => configuration.requestChange(setting.id, value)
                  : requestNumericChange
              }
              key={group.id}
            />
          ))}
        </div>
      ) : (
        <ChangeHistory entries={configuration.auditHistory} />
      )}

      <SaveConfigurationModal
        change={configuration.pendingChange}
        onCancel={cancelChange}
        onSave={saveChange}
      />
    </main>
  );
}

export default SystemConfiguration;
