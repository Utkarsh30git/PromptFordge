import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import GridBackground from "../components/layout/GridBackground";
import Spotlight from "../components/layout/Spotlight";
import GoogleLogin from "../components/auth/GoogleLogin";
import useAuthStore from "../store/authStore";

const cardMotion = {
  hidden: {
    opacity: 0,
    y: 24,
    filter: "blur(6px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const Login = () => {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const navigate = useNavigate();

  // Already authenticated users shouldn't see the login card.
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  // Avoid flashing the login card while we're still resolving
  // the current session, or while redirecting an authed user.
  if (loading || user) {
    return <div className="login-page" />;
  }

  return (
    <div className="login-page">
      <GridBackground />
      <Spotlight />

      <div className="login-topbar">
        <Link to="/" className="login-logo">
          <span className="logo-dot"></span>
          PromptForge
        </Link>
      </div>

      <div className="login-center">
        <motion.div
          className="login-card"
          variants={cardMotion}
          initial="hidden"
          animate="visible"
        >
          <p className="login-kicker mono">Welcome back</p>

          <h1 className="login-title">Sign in to PromptForge</h1>

          <p className="login-subtitle">
            Continue to your PromptForge workspace to build, compare, and
            optimize your prompts.
          </p>

          <div className="login-google-wrap">
            <GoogleLogin />
          </div>

          <div className="login-divider">or</div>

          <p className="login-footnote">
            Secure authentication powered by Google
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
