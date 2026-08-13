import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Container from "../components/ui/Container";
import Button from "../components/ui/Button";
import UserAvatar from "../components/ui/UserAvatar";
import AvatarPickerModal from "../features/settings/AvatarPickerModal";
import useAuthStore from "../store/authStore";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "account", label: "Account" },
  { id: "usage", label: "Usage" },
  { id: "security", label: "Security" },
];

const formatDate = (date) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const Settings = () => {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const updateAvatar = useAuthStore((state) => state.updateAvatar);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  // Profile editing — local until "Save Changes" is clicked.
  const [nameDraft, setNameDraft] = useState(user?.name || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileStatus, setProfileStatus] = useState("");

  const [loggingOut, setLoggingOut] = useState(false);

  const nameDirty = user && nameDraft.trim() !== user.name;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (savingProfile) return;

    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setProfileError("Name is required");
      setProfileStatus("");
      return;
    }

    setSavingProfile(true);
    setProfileError("");
    setProfileStatus("");

    try {
      await updateProfile(trimmed);
      setProfileStatus("Saved");
      window.setTimeout(() => setProfileStatus(""), 2200);
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to update profile";
      setProfileError(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="app-page">
        <Container>
          <div className="section-heading app-page-heading">
            <p className="section-kicker mono">SETTINGS</p>
            <h1 className="section-title">Account settings</h1>
          </div>
          <div className="settings-card">
            <div className="panel-empty-hint">Loading…</div>
          </div>
        </Container>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-page">
        <Container>
          <div className="section-heading app-page-heading">
            <p className="section-kicker mono">SETTINGS</p>
            <h1 className="section-title">Account settings</h1>
          </div>
          <div className="settings-error-state">
            <p>Unable to load account information.</p>
            <Button variant="ghost" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="app-page">
      <Container>
        <div className="section-heading app-page-heading">
          <p className="section-kicker mono">SETTINGS</p>
          <h1 className="section-title">Account settings</h1>
        </div>

        <div className="settings-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`settings-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "profile" && (
          <div className="settings-card settings-card-wide">
            <div className="settings-profile-header">
              <div className="settings-avatar-cell">
                <UserAvatar user={user} size={64} />
                <button
                  type="button"
                  className="settings-change-avatar-btn"
                  onClick={() => setAvatarPickerOpen(true)}
                >
                  Change Avatar
                </button>
              </div>

              <div className="settings-profile-identity">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
                <span className="settings-connected-badge">
                  Google Account · Connected
                </span>
              </div>
            </div>

            <form className="settings-form" onSubmit={handleSaveProfile}>
              <div className="settings-field">
                <label className="settings-field-label" htmlFor="profile-name">
                  Name
                </label>
                <input
                  id="profile-name"
                  className="settings-input"
                  value={nameDraft}
                  onChange={(e) => {
                    setNameDraft(e.target.value);
                    setProfileError("");
                  }}
                  maxLength={100}
                  placeholder="Your name"
                />
              </div>

              <div className="settings-field">
                <label className="settings-field-label">Email</label>
                <input
                  className="settings-input"
                  value={user.email}
                  disabled
                  title="Email is your authenticated Google identity and can't be changed here."
                />
              </div>

              <div className="settings-save-row">
                <Button
                  type="submit"
                  variant="amber"
                  disabled={savingProfile || !nameDirty}
                >
                  {savingProfile ? "Saving…" : "Save Changes"}
                </Button>

                {profileError && (
                  <span className="settings-form-error">{profileError}</span>
                )}
                {profileStatus && (
                  <span className="settings-form-status">{profileStatus}</span>
                )}
              </div>
            </form>
          </div>
        )}

        {activeTab === "account" && (
          <div className="settings-card">
            <div className="settings-row">
              <span className="settings-label">Email</span>
              <span className="settings-value">{user.email}</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">Authentication</span>
              <span className="settings-value">Google</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">Account created</span>
              <span className="settings-value">
                {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
        )}

        {activeTab === "usage" && (
          <div className="settings-card">
            <div className="settings-row">
              <span className="settings-label">Current plan</span>
              <span className="settings-value settings-plan">
                {user.plan || "free"}
              </span>
            </div>
            <div className="settings-row">
              <span className="settings-label">Credits remaining</span>
              <span className="settings-value settings-credits">
                {user.credits ?? "—"}
              </span>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="settings-card">
            <div className="settings-row">
              <span className="settings-label">Authentication</span>
              <span className="settings-value">Google</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">Session</span>
              <span className="settings-value">Active</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">Session token</span>
              <span className="settings-value">HTTP-only cookie</span>
            </div>

            <div className="settings-logout-row">
              <Button
                variant="danger"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Logging out…" : "Log Out"}
              </Button>
            </div>
          </div>
        )}
      </Container>

      <AvatarPickerModal
        open={avatarPickerOpen}
        user={user}
        onClose={() => setAvatarPickerOpen(false)}
        onSave={updateAvatar}
      />
    </div>
  );
};

export default Settings;
