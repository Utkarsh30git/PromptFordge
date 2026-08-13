import { useParams } from "react-router-dom";
import WorkspaceFeature from "../features/workspace/Workspace";

const Workspace = () => {
  // Present when navigated to via /prompts/:id (opening a prompt
  // directly from the Library). Absent for the plain /workspace route,
  // where the user picks a collection/prompt from the sidebar as before.
  const { id: promptId } = useParams();
  return <WorkspaceFeature promptId={promptId} />;
};

export default Workspace;
