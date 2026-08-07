import { Routes, Route } from "react-router-dom";

import Landing from "./features/landing/Landing.jsx";
import Dashboard from "./pages/Dashboard";
import Workspace from "./pages/Workspace";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/workspace" element={<Workspace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;