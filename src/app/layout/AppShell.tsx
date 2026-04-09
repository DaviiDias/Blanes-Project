import { Outlet, useLocation } from "react-router-dom";

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const { pathname } = useLocation();
  const isBoardRoute = pathname.startsWith("/boards/");

  return (
    <div className={`app-shell${isBoardRoute ? " app-shell--board-focus" : ""}`}>
      <Header />
      {!isBoardRoute && <Sidebar />}
      <main className="app-content" aria-live="polite">
        <Outlet />
      </main>
    </div>
  );
}
