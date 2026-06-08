import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./popup.css";

const root = document.getElementById("app");
if (!root) throw new Error("Missing element: #app");

createRoot(root).render(<App />);
