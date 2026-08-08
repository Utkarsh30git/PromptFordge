const CompareCard = ({ variant }) => {
    const winner = variant === "right";
  
    return (
      <div className={`compare-card ${winner ? "winner" : ""}`}>
  
        {winner && (
          <div className="winner-badge">
            WINNER
          </div>
        )}
  
        <p className="compare-version">
          {winner ? "PROMPT B • v3" : "PROMPT A • v2"}
        </p>
  
        <p className="compare-text">
          {winner
            ? `"Explain React to a beginner in under 300 words using one real-world example."`
            : `"Explain React." — a bare, unconstrained prompt.`}
        </p>
  
        <div className="compare-stats">
  
          <div>
            <span>TOKENS</span>
            <strong>{winner ? "290" : "620"}</strong>
          </div>
  
          <div>
            <span>LATENCY</span>
            <strong>{winner ? "0.8s" : "1.4s"}</strong>
          </div>
  
          <div>
            <span>SCORE</span>
            <strong>{winner ? "9.3" : "7.1"}</strong>
          </div>
  
        </div>
  
      </div>
    );
  };
  
  export default CompareCard;