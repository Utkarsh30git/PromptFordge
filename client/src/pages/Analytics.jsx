import Container from "../components/ui/Container";
import EmptyState from "../components/ui/EmptyState";

const Analytics = () => {
  return (
    <div className="app-page">
      <Container>
        <div className="section-heading app-page-heading">
          <p className="section-kicker mono">ANALYTICS</p>
          <h1 className="section-title">Your prompt analytics</h1>
        </div>

        <EmptyState
          title="Analytics dashboards are in development"
          description="Runs, cost, latency, and token usage across your whole workspace will live here — so you always know what's improving and what's drifting."
          ctaLabel="View Dashboard"
          ctaTo="/dashboard"
        />
      </Container>
    </div>
  );
};

export default Analytics;
