import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { queryClient } from './lib/queryClient.ts';

createRoot(document.getElementById("root")!).render(<App />);