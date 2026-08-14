import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const ChevronDownIcon = (props) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const CheckIcon = (props) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const SelectDropdown = ({
  options,
  value,
  onChange,
  caption,
  placeholder = "Select…",
  disabled = false,
  fullWidth = false,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const active = options.find((opt) => opt.id === value);
  const displayLabel = active?.label ?? placeholder;
  const isPlaceholder = !active;

  useEffect(() => {
    const handleClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const handleSelect = (id) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div
      className={`sort-dropdown ${fullWidth ? "sort-dropdown-full" : ""}`}
      ref={rootRef}
    >
      <button
        type="button"
        className={`sort-dropdown-trigger ${open ? "open" : ""}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span
          className={`sort-dropdown-label ${isPlaceholder ? "sort-dropdown-placeholder" : ""}`}
        >
          {caption && <span className="sort-dropdown-caption">{caption}</span>}
          {displayLabel}
        </span>
        <ChevronDownIcon className="sort-dropdown-chevron" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            className="sort-dropdown-menu"
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {options.map((opt) => {
              const isActive = opt.id === value;
              return (
                <li key={opt.id} role="option" aria-selected={isActive}>
                  <button
                    type="button"
                    className={`sort-dropdown-item ${isActive ? "active" : ""}`}
                    onClick={() => handleSelect(opt.id)}
                  >
                    <span>{opt.label}</span>
                    {isActive && <CheckIcon className="sort-dropdown-check" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SelectDropdown;
