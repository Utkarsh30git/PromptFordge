import GridBackground from "../../components/layout/GridBackground";
import Spotlight from "../../components/layout/Spotlight";
import Container from "../../components/ui/Container";
import Button from "../../components/ui/Button";
import HeroPreview from "./HeroPreview";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 35,
    filter: "blur(8px)",
  },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 1.1,
      delay,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="hero">
      <GridBackground />

      <Spotlight />

      <Container>
        <div className="hero-content">
          <motion.p
            className="hero-kicker mono"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.2}
          ></motion.p>

          <motion.h1
            className="hero-title"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.4}
          >
            Build Better
            <br />
            <span>AI Prompts</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle mono"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.7}
          >
            Version.
            <span>•</span>
            Compare.
            <span>•</span>
            Optimize.
          </motion.p>

          <motion.div
            className="hero-buttons"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1.1}
          >
            <Button variant="amber" onClick={() => navigate("/login")}>
              Run Prompt →
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                window.open(
                  "https://github.com/Utkarsh30git/PromptFordge",
                  "_blank",
                );
              }}
            >
              Github
            </Button>
          </motion.div>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.2}
          >
            <HeroPreview />
          </motion.div>
        </div>
      </Container>
    </section>
  );
};

export default Hero;
