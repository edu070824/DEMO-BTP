import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AppLayout from "./components/layout/AppLayout";
import AdminView from "./views/AdminView";
import CustomersView from "./views/CustomersView";
import HomeView from "./views/HomeView";
import OrdersView from "./views/OrdersView";
import ProductsView from "./views/ProductsView";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomeView />} />
        <Route path="productos" element={<ProductsView />} />
        <Route path="clientes" element={<CustomersView />} />
        <Route path="pedidos" element={<OrdersView />} />
        <Route path="admin" element={<AdminView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
