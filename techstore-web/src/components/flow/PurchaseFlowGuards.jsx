import { Navigate } from "react-router-dom";
import { useTechStore } from "../../hooks/useTechStore";

function RequireProduct({ children }) {
  const { cart } = useTechStore();

  return cart.length > 0 ? (
    children
  ) : (
    <Navigate
      to="/productos"
      replace
      state={{ blockedFlowDestination: "/clientes" }}
    />
  );
}

function RequireOrderReady({ children }) {
  const { cart, selectedCustomer } = useTechStore();

  if (cart.length === 0) {
    return (
      <Navigate
        to="/productos"
        replace
        state={{ blockedFlowDestination: "/pedidos" }}
      />
    );
  }

  if (!selectedCustomer) {
    return (
      <Navigate
        to="/clientes"
        replace
        state={{ blockedFlowDestination: "/pedidos" }}
      />
    );
  }

  return children;
}

export { RequireOrderReady, RequireProduct };
