import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./App.css";
import { SelectedServerProvider } from "./context/SelectedServerContext.tsx";

createRoot(document.getElementById("root")!).render(
  <SelectedServerProvider>
    <App />
  </SelectedServerProvider>,
);
