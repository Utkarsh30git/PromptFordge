import { useNavigate } from "react-router-dom";
import { NAV_LINKS } from "../../constants/navigation";
import Button from "../ui/Button";
import UserMenu from "./UserMenu";
import useAuthStore from "../../store/authStore";

const Navbar = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  return (
    <nav>
      <div className="nav-inner">

        {}
        <div className="logo">
          <span className="logo-dot"></span>
          PromptForge
        </div>

        {}
        <div className="nav-links">
          {NAV_LINKS.map((link) => (
            <a key={link.name} href={link.href}>
              {link.name}
            </a>
          ))}
        </div>

        {}
        <div className="nav-actions">

          {!user ? (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  window.open(
                    "https://github.com/Utkarsh30git/PromptFordge",
                    "_blank"
                  );
                }}
              >
                Github
              </Button>

              <Button
                variant="amber"
                onClick={() => navigate("/login")}
              >
                Get Started
              </Button>
            </>
          ) : (
            <UserMenu user={user} />
          )}

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
