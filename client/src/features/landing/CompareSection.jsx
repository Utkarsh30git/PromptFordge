import Container from "../../components/ui/Container";
import CompareCard from "../../components/ui/CompareCard";

const CompareSection = () => {
  return (
    <section className="compare-section" id="compare">
      <Container>
        <div className="section-heading">

          <p className="section-kicker mono">
            BENCHMARKING
          </p>

          <h2 className="section-title">
            Don't guess which prompt wins.
            <br />
            Measure it.
          </h2>

          <p className="section-description">
            Run two versions against the same input and compare
            quality, latency, cost and token usage.
          </p>

        </div>

        <div className="compare-grid">

          <CompareCard variant="left" />

          <CompareCard variant="right" />

        </div>

      </Container>
    </section>
  );
};

export default CompareSection;