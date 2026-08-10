import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
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
    </div>
  );
}

export default AppLayout;
