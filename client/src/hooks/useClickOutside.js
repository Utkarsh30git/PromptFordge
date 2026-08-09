import { useEffect } from "react";

/**
 * Calls `handler` whenever a pointer event occurs outside of `ref`.
 * Used to close dropdowns/menus (e.g. the user account menu) when the
 * user clicks anywhere else on the page.
 */
const useClickOutside = (ref, handler, active = true) => {
  useEffect(() => {
    if (!active) return;

    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler, active]);
};

export default useClickOutside;
