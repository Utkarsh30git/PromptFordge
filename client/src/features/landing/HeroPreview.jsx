import Typewriter from "../../components/animations/Typewriter";

const HeroPreview = () => {
  return (
    <div className="hero-preview">
      {}
      <div className="preview-header">
        <div className="preview-controls">
          <span className="dot red"></span>

          <span className="dot yellow"></span>

          <span className="dot green"></span>
        </div>

        <div className="preview-file mono">interview-question.prompt • v4</div>
      </div>

      {}

      <div className="preview-body">
        {}

        <div className="prompt-section">
          <p className="section-label">PROMPT</p>

          <p className="prompt-text mono">
            <Typewriter
              text="Write an interview question for a senior React developer..."
              speed={70}
              delay={1000}
            />
          </p>
        </div>

        <div className="preview-divider"></div>

        {}

        <div className="response-section">
          <p className="response-text">
            "What's the difference between useMemo and useCallback, and when
            would using one hurt more than help? Follow-up: how would you
            profile a re-render that shouldn't be happening?"
          </p>
        </div>
        <div className="preview-divider"></div>

        <div className="preview-metrics">
          <div className="metric">
            <span>LATENCY</span>
            <strong>1.1s</strong>
          </div>

          <div className="metric">
            <span>TOKENS</span>
            <strong>420</strong>
          </div>

          <div className="metric">
            <span>COST</span>
            <strong>$0.0012</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroPreview;
