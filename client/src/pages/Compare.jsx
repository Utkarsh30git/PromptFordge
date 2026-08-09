import Container from "../components/ui/Container";
import EmptyState from "../components/ui/EmptyState";

const Compare = () => {
  return (
    <div className="app-page">
      <Container>
        <div className="section-heading app-page-heading">
          <p className="section-kicker mono">COMPARE</p>
          <h1 className="section-title">Compare prompt versions</h1>
        </div>

        <EmptyState
          title="Version comparison is on its way"
          description="Soon you'll be able to run two prompt versions side by side and see exactly how tokens, cost, latency, and quality score shift between them."
          ctaLabel="Open Workspace"
          ctaTo="/workspace"
        />
      </Container>
    </div>
  );
};

export default Compare;
