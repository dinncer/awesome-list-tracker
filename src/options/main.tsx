import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./options.css";

const root = document.getElementById("app");
if (!root) throw new Error("Missing element: #app");

createRoot(root).render(<App />);
