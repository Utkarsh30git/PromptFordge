import Container from "../components/ui/Container";
import EmptyState from "../components/ui/EmptyState";
import useAuthStore from "../store/authStore";

const Settings = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="app-page">
      <Container>
        <div className="section-heading app-page-heading">
          <p className="section-kicker mono">SETTINGS</p>
          <h1 className="section-title">Account settings</h1>
        </div>

        <div className="settings-card">
          <div className="settings-row">
            <span className="settings-label">Name</span>
            <span className="settings-value">{user?.name}</span>
          </div>
          <div className="settings-row">
            <span className="settings-label">Email</span>
            <span className="settings-value">{user?.email}</span>
          </div>
          <div className="settings-row">
            <span className="settings-label">Plan</span>
            <span className="settings-value settings-plan">{user?.plan || "free"}</span>
          </div>
          <div className="settings-row">
            <span className="settings-label">Credits</span>
            <span className="settings-value">{user?.credits ?? "—"}</span>
          </div>
        </div>

        <EmptyState
          title="More settings are coming soon"
          description="Billing, API keys, team members, and notification preferences will live here next."
          ctaLabel="Open Workspace"
          ctaTo="/workspace"
        />
      </Container>
    </div>
  );
};

export default Settings;
