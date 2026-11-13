import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Providers } from "./app/providers";
import { router } from "./app/router";
import { reloadForNewBuild } from "./common/utils/reload-new-build";
import "./styles/globals.css";

window.addEventListener("vite:preloadError", reloadForNewBuild);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);
