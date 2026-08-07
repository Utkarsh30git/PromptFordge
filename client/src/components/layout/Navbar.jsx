import { NAV_LINKS } from "../../constants/navigation";
import Button from "../ui/Button";

const Navbar = () => {
  return (
    <nav>
      <div className="nav-inner">

        <div className="logo">
          <span className="logo-dot"></span>
          PromptForge
        </div>

        <div className="nav-links">
          {NAV_LINKS.map((link) => (
            <a key={link.name} href={link.href}>
              {link.name}
            </a>
          ))}
        </div>

        <div className="nav-actions">
          <Button variant="ghost">
            Github
          </Button>

          <Button variant="amber">
            Get Started
          </Button>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;