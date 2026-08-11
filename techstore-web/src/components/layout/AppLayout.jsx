import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AssistantWidget from "../assistant/AssistantWidget";
import CartPanel from "./CartPanel";
import Header from "./Header";

function AppLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <div className="app">
      <Header />

      <main>
        <Outlet />
      </main>

      <CartPanel />
      <AssistantWidget />
    </div>
  );
}

export default AppLayout;
