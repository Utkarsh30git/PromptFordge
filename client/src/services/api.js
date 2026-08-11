import axios from "axios";

// Same API origin used by authStore.js / GoogleLogin.jsx.
const API_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export default api;
