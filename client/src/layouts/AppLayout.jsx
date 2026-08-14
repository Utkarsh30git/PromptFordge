import { Outlet } from "react-router-dom";
import AppNavbar from "../components/layout/AppNavbar";
import AppBackground from "../components/layout/AppBackground";

const AppLayout = () => {
  return (
    <div className="app-shell">
      <AppBackground />
      <AppNavbar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
