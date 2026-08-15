import { NavLink, Link } from "react-router-dom";
import UserMenu from "./UserMenu";
import useAuthStore from "../../store/authStore";
import logo from "../../assets/logo.png";

const APP_LINKS = [
  { name: "Dashboard", to: "/dashboard" },
  { name: "Prompts", to: "/prompts" },
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
          <img src={logo} alt="PromptForge" className="logo-image" />
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
