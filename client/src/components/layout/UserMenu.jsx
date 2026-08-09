import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import useAuthStore from "../../store/authStore";
import useClickOutside from "../../hooks/useClickOutside";

/**
 * Authenticated account menu: avatar trigger + dropdown.
 * Shared between the marketing Navbar (shown when a logged-in
 * user visits "/") and the authenticated AppNavbar.
 */
const UserMenu = ({ user }) => {
  const [open, setOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const menuRef = useRef(null);

  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  useClickOutside(menuRef, () => setOpen(false), open);

  const initials = user?.name?.charAt(0).toUpperCase() || "?";

  const handleNavigate = (path) => {
    setOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        {user.avatar && !avatarFailed ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="user-avatar"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <span className="user-avatar-fallback">{initials}</span>
        )}

        <span className="user-name">{user.name}</span>

        <span className={`user-chevron ${open ? "open" : ""}`}>▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="user-dropdown"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="user-info">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>

            <div className="dropdown-divider"></div>

            <button
              className="dropdown-item"
              onClick={() => handleNavigate("/dashboard")}
            >
              Dashboard
            </button>

            <button
              className="dropdown-item"
              onClick={() => handleNavigate("/workspace")}
            >
              Workspace
            </button>

            <button
              className="dropdown-item"
              onClick={() => handleNavigate("/settings")}
            >
              Settings
            </button>

            <div className="dropdown-divider"></div>

            <button className="dropdown-item logout" onClick={handleLogout}>
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;
