import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AssistantWidget from "../assistant/AssistantWidget";
import FlowToastCenter from "../feedback/FlowToastCenter";
import { useTechStore } from "../../hooks/useTechStore";
import CartPanel from "./CartPanel";
import Header from "./Header";

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { requestFlowNavigation } = useTechStore();
  const { pathname } = location;
  const blockedFlowDestination = location.state?.blockedFlowDestination;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  useEffect(() => {
    if (!blockedFlowDestination) {
      return;
    }

    requestFlowNavigation(blockedFlowDestination);
    navigate(pathname, { replace: true, state: null });
  }, [
    blockedFlowDestination,
    navigate,
    pathname,
    requestFlowNavigation,
  ]);

  return (
    <div className="app">
      <Header />
      <main>
        <Outlet />
      </main>
      <CartPanel />
      <AssistantWidget />
      <FlowToastCenter />
    </div>
  );
}

export default AppLayout;
