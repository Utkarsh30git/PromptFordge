import { Outlet } from "react-router-dom";
import AppNavbar from "../components/layout/AppNavbar";

/**
 * Shell for every authenticated screen (Dashboard, Workspace,
 * Compare, Analytics, Settings). Provides the persistent app
 * navigation and consistent page padding, while each route
 * decides its own content.
 */
const AppLayout = () => {
  return (
    <div className="app-shell">
      <AppNavbar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
