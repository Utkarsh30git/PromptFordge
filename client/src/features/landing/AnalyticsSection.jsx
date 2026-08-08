import Container from "../../components/ui/Container";

const METRICS = [
  {
    label: "Runs Today",
    value: "120",
    delta: "↑ 12% vs yesterday",
    direction: "up",
  },
  {
    label: "Avg Latency",
    value: "1.3s",
    delta: "↓ 18% faster",
    direction: "up",
  },
  {
    label: "Tokens Used",
    value: "24,000",
    delta: "↑ 5% vs last week",
    direction: "down",
  },
  {
    label: "Avg AI Score",
    value: "9.1",
    delta: "↑ 0.4 this week",
    direction: "up",
  },
];

const AnalyticsSection = () => {
  return (
    <section id="analytics" className="analytics-section">
      <Container>
        <div className="section-heading">
          <p className="section-kicker mono">ANALYTICS</p>

          <h2 className="section-title">Every run, tracked.</h2>

          <p className="section-description">
            Runs, cost, latency, and token usage across your whole
            workspace — so you know exactly what's improving and
            what's drifting.
          </p>
        </div>

        <div className="analytics-grid">
          {METRICS.map((metric) => (
            <div className="analytics-card" key={metric.label}>
              <div className="analytics-label">{metric.label}</div>

              <div className="analytics-value">{metric.value}</div>

              <div className={`analytics-delta ${metric.direction}`}>
                {metric.delta}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default AnalyticsSection;
