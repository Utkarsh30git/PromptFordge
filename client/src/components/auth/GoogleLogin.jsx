import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useAuthStore from "../../store/authStore";

const GoogleLogin = () => {
  const googleButtonRef = useRef(null);
  const initializedRef = useRef(false);

  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();

  useEffect(() => {
    // Prevent duplicate initialization
    if (initializedRef.current) {
      return;
    }

    // Google script hasn't loaded yet
    if (!window.google || !googleButtonRef.current) {
      console.warn("Google Identity Services is not loaded yet.");
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error(
        "VITE_GOOGLE_CLIENT_ID is missing from client/.env"
      );
      return;
    }

    initializedRef.current = true;

    window.google.accounts.id.initialize({
      client_id: clientId,

      callback: async (response) => {
        try {
          console.log("Google credential received");

          const result = await axios.post(
            "http://localhost:8000/api/auth/google",
            {
              credential: response.credential,
            },
            {
              withCredentials: true,
            }
          );

          console.log("Login successful:", result.data);

          // Store authenticated user globally
          setUser(result.data.user);

          // Redirect into the app after successful login
          navigate("/dashboard");

        } catch (error) {
          console.error(
            "Google login failed:",
            error.response?.data || error.message
          );
        }
      },
    });

    window.google.accounts.id.renderButton(
      googleButtonRef.current,
      {
        theme: "filled_black",
        size: "large",
        width: 280,
        text: "continue_with",
      }
    );
  }, [setUser, navigate]);

  return <div ref={googleButtonRef}></div>;
};

export default GoogleLogin;