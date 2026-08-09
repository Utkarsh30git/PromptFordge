import { NavLink, Link } from "react-router-dom";
import UserMenu from "./UserMenu";
import useAuthStore from "../../store/authStore";

const APP_LINKS = [
  { name: "Dashboard", to: "/dashboard" },
  { name: "Workspace", to: "/workspace" },
  { name: "Compare", to: "/compare" },
  { name: "Analytics", to: "/analytics" },
];

const AppNavbar = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <nav className="app-nav">
      <div className="app-nav-inner">

        <Link to="/dashboard" className="logo">
          <span className="logo-dot"></span>
          PromptForge
        </Link>

        <div className="app-nav-links">
          {APP_LINKS.map((link) => (
            <NavLink
              key={link.name}
              to={link.to}
              className={({ isActive }) =>
                `app-nav-link ${isActive ? "active" : ""}`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </div>

        <div className="app-nav-actions">
          {user && <UserMenu user={user} />}
        </div>

      </div>
    </nav>
  );
};

export default AppNavbar;
