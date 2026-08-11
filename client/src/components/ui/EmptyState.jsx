import { useNavigate } from "react-router-dom";
import Button from "./Button";

/**
 * Premium "coming soon" placeholder used by pages that only have
 * their navigation/structure established so far (Compare, Analytics,
 * Settings) — keeps them feeling like part of the product rather
 * than a broken or missing page.
 */
const EmptyState = ({
  title,
  description,
  kicker = "Coming soon",
  ctaLabel = "Open Workspace",
  ctaTo = "/workspace",
}) => {
  const navigate = useNavigate();

  return (
    <div className="empty-state">
      <p className="empty-state-kicker mono">{kicker}</p>
      <h2 className="empty-state-title">{title}</h2>
      <p className="empty-state-description">{description}</p>

      <Button variant="amber" onClick={() => navigate(ctaTo)}>
        {ctaLabel}
      </Button>
    </div>
  );
};

export default EmptyState;
