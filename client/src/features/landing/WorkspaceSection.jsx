import Container from "../../components/ui/Container";
import WorkspaceMockup from "./WorkspaceMockup";

const WorkspaceSection = () => {
  return (
    <section id="workspace" className="workspace-section">
      <Container>
        <div className="section-heading">
          <p className="section-kicker mono">
            THE WORKSPACE
          </p>

          <h2 className="section-title">
            One screen. Three panels.
            <br />
            Zero context switching.
          </h2>

          <p className="section-description">
            Collections on the left, your editor in the middle,
            live metrics on the right — with every save tracked
            on a commit rail, like Git for your prompts.
          </p>
        </div>

        <WorkspaceMockup />
      </Container>
    </section>
  );
};

export default WorkspaceSection;