import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AppLayout from "./components/layout/AppLayout";
import {
  PublicOnly,
  RequireAdmin,
  RequireAuth,
} from "./components/auth/RouteGuards";
import {
  RequireOrderReady,
  RequireProduct,
} from "./components/flow/PurchaseFlowGuards";
import AdminView from "./views/AdminView";
import CustomersView from "./views/CustomersView";
import HomeView from "./views/HomeView";
import LoginView from "./views/LoginView";
import OrdersView from "./views/OrdersView";
import ProductsView from "./views/ProductsView";

function App() {
  return (
    <Routes>
      <Route
        path="login"
        element={
          <PublicOnly>
            <LoginView />
          </PublicOnly>
        }
      />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomeView />} />
          <Route path="productos" element={<ProductsView />} />
          <Route
            path="clientes"
            element={
              <RequireProduct>
                <CustomersView />
              </RequireProduct>
            }
          />
          <Route
            path="pedidos"
            element={
              <RequireOrderReady>
                <OrdersView />
              </RequireOrderReady>
            }
          />
          <Route
            path="admin"
            element={
              <RequireAdmin>
                <AdminView />
              </RequireAdmin>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
