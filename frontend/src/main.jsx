import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import axios from 'axios'; // 1. IMPORT AXIOS

// 2. SET THE GLOBAL BASE URL FOR YOUR ENTIRE APP
axios.defaults.baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);