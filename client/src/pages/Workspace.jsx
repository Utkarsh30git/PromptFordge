import { useParams } from "react-router-dom";
import WorkspaceFeature from "../features/workspace/Workspace";

const Workspace = () => {

  const { id: promptId } = useParams();
  return <WorkspaceFeature promptId={promptId} />;
};

export default Workspace;
