import { useEffect, useState } from "react";

import {
  ArrowLeft,
  UserRound,
  Bell,
  Shield,
  Palette,
  Save,
  LockKeyhole,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import { apiRequest } from "./api";
import "./team-settings.css";

interface Props {
  onBack: () => void;
}

interface UserData {
  id: number;
  email: string;
  role: string;
  full_name?: string | null;
}

interface SettingsData {
  name: string;
  email: string;
  designation: string;
  emailNotifications: boolean;
  investigationAlerts: boolean;
  securityAlerts: boolean;
  compactView: boolean;
}

const defaultSettings: SettingsData = {
  name: "",
  email: "",
  designation: "Investigator",
  emailNotifications: true,
  investigationAlerts: true,
  securityAlerts: true,
  compactView: false,
};

const InvestigatorSettings = ({ onBack }: Props) => {
  const [user, setUser] = useState<UserData | null>(null);

  const [settings, setSettings] =
    useState<SettingsData>(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [savedMessage, setSavedMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError("");

    try {
      const data: UserData = await apiRequest("/auth/me");

      setUser(data);

      setSettings((previous) => ({
        ...previous,
        name: data.full_name || "",
        email: data.email,
        designation:
          data.role === "admin" ? "Administrator" : "Investigator",
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load account information."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = <K extends keyof SettingsData>(
    key: K,
    value: SettingsData[K]
  ) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));

    setSavedMessage("");
  };

  const saveSettings = async () => {
    setSaving(true);
    setError("");
    setSavedMessage("");

    try {
      // Notification and appearance preferences are stored locally.
      // Profile updates require a backend endpoint that is not
      // implemented in the current API.
      localStorage.setItem(
        "NexusClaimPreferences",
        JSON.stringify({
          emailNotifications: settings.emailNotifications,
          investigationAlerts: settings.investigationAlerts,
          securityAlerts: settings.securityAlerts,
          compactView: settings.compactView,
        })
      );

      setSavedMessage(
        "Workspace preferences saved. Profile details are read-only."
      );
    } catch {
      setError("Unable to save workspace preferences.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (
    label: string,
    description: string,
    key:
      | "emailNotifications"
      | "investigationAlerts"
      | "securityAlerts"
      | "compactView"
  ) => (
    <div className="settings-option">
      <div>
        <strong>{label}</strong>
        <p>{description}</p>
      </div>

      <button
        type="button"
        className={`settings-toggle ${
          settings[key] ? "enabled" : ""
        }`}
        onClick={() => updateSetting(key, !settings[key])}
        aria-label={`Toggle ${label}`}
        aria-pressed={settings[key]}
      >
        <span />
      </button>
    </div>
  );

  return (
    <div className="management-page">
      <button className="management-back" onClick={onBack}>
        <ArrowLeft size={17} />
        Back to Dashboard
      </button>

      <div className="management-header">
        <div>
          <span className="management-eyebrow">
            PERSONAL PREFERENCES
          </span>

          <h1>Settings</h1>

          <p>
            Manage your investigator profile and workspace preferences.
          </p>
        </div>

        <button
          className="management-primary"
          onClick={saveSettings}
          disabled={loading || saving}
        >
          {saving ? (
            <RefreshCw size={17} />
          ) : (
            <Save size={17} />
          )}

          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {loading && (
        <div className="settings-success">
          <RefreshCw size={17} />
          Loading account information...
        </div>
      )}

      {error && (
        <div className="settings-security-info">
          <AlertCircle size={20} />
          <div>
            <strong>Account Information Error</strong>
            <p>{error}</p>

            <button
              className="management-primary"
              onClick={loadSettings}
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        </div>
      )}

      {savedMessage && (
        <div className="settings-success">
          <CheckCircle size={17} />
          {savedMessage}
        </div>
      )}

      <section className="settings-panel">
        <div className="settings-panel-heading">
          <UserRound />

          <div>
            <h2>Investigator Profile</h2>
            <p>Account information from the NexusClaim backend.</p>
          </div>
        </div>

        <div className="settings-form-grid">
          <label>
            Full Name
            <input
              value={settings.name}
              readOnly
              placeholder="Name not provided"
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              value={settings.email}
              readOnly
            />
          </label>

          <label>
            Designation
            <input
              value={settings.designation}
              readOnly
            />
          </label>
        </div>

        {user && (
          <div className="settings-theme-info">
            <Shield size={19} />

            <div>
              <strong>Authenticated Account</strong>
              <p>
                User ID: {user.id} · Role: {user.role}
              </p>
            </div>

            <span>VERIFIED</span>
          </div>
        )}
      </section>

      <section className="settings-panel">
        <div className="settings-panel-heading">
          <Bell />

          <div>
            <h2>Notifications</h2>
            <p>Manage your notification preferences.</p>
          </div>
        </div>

        {toggle(
          "Email Notifications",
          "Preference for receiving important updates through email.",
          "emailNotifications"
        )}

        {toggle(
          "Investigation Alerts",
          "Preference for alerts about new and pending investigations.",
          "investigationAlerts"
        )}

        {toggle(
          "Security Alerts",
          "Preference for security-related notifications.",
          "securityAlerts"
        )}
      </section>

      <section className="settings-panel">
        <div className="settings-panel-heading">
          <Palette />

          <div>
            <h2>Appearance</h2>
            <p>Customize your dashboard experience.</p>
          </div>
        </div>

        {toggle(
          "Compact Dashboard",
          "Save your preference for a compact dashboard layout.",
          "compactView"
        )}

        <div className="settings-theme-info">
          <Palette size={19} />

          <div>
            <strong>Dark Theme</strong>
            <p>
              NexusClaim currently uses its default interface.
            </p>
          </div>

          <span>ACTIVE</span>
        </div>
      </section>

      <section className="settings-panel">
        <div className="settings-panel-heading">
          <Shield />

          <div>
            <h2>Security & Privacy</h2>
            <p>Information about your authenticated workspace.</p>
          </div>
        </div>

        <div className="settings-security-info">
          <LockKeyhole size={20} />

          <div>
            <strong>Backend Authentication Active</strong>

            <p>
              NexusClaim uses authenticated API requests with
              bearer tokens. Account access is controlled by
              the assigned user role. Password changes and
              profile editing are not yet available in this version.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InvestigatorSettings;