import Container from "../../components/ui/Container";
import Button from "../../components/ui/Button";

const CTASection = () => {
  return (
    <section className="cta-section" id="get-started">
      <Container>
        <h2 className="cta-title">
          Start versioning
          <br />
          your prompts today.
        </h2>

        <p className="cta-subtitle mono">
          Free for individuals. No credit card required.
        </p>

        <div className="cta-actions">
          <Button variant="amber" >Get Started — it's free</Button>
        </div>
      </Container>
    </section>
  );
};

export default CTASection;
