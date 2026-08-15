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
    if (initializedRef.current) {
      return;
    }

    if (!window.google || !googleButtonRef.current) {
      console.warn("Google Identity Services is not loaded yet.");
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const API_URL = import.meta.env.VITE_API_URL;

    if (!clientId) {
      console.error("VITE_GOOGLE_CLIENT_ID is missing.");
      return;
    }

    if (!API_URL) {
      console.error("VITE_API_URL is missing.");
      return;
    }

    initializedRef.current = true;

    window.google.accounts.id.initialize({
      client_id: clientId,

      callback: async (response) => {
        try {
          console.log("Google credential received");

          const result = await axios.post(
            `${API_URL}/api/auth/google`,
            {
              credential: response.credential,
            },
            {
              withCredentials: true,
            }
          );

          console.log("Login successful:", result.data);

          setUser(result.data.user);

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