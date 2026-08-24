import { createRoot } from "react-dom/client";
import App from "./App";
import { UserProvider } from "./lib/user-context";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <UserProvider>
    <App />
  </UserProvider>
);
