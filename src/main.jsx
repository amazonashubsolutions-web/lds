import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import "./assets/css/styles.css";
import { PanelSessionProvider } from "./contexts/PanelSessionContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PanelSessionProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PanelSessionProvider>
  </StrictMode>,
);
