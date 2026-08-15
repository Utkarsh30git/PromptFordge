import { motion } from "framer-motion";

// Same easing/feel as the Hero's on-load fadeUp — reused here so
// sections revealed on scroll match the motion language already
// established at the top of the page.
const fadeUp = {
  hidden: {
    opacity: 0,
    y: 35,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

/**
 * Wraps its children so they fade/slide/blur into place the first time
 * they scroll into view, instead of being visible immediately on load.
 */
const ScrollReveal = ({ children, className = "" }) => {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
