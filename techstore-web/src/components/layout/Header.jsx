import { NavLink } from "react-router-dom";
import { useTechStore } from "../../hooks/useTechStore";

const navigationItems = [
  { label: "Inicio", to: "/" },
  { label: "Productos", to: "/productos" },
  { label: "Clientes", to: "/clientes" },
  { label: "Pedidos", to: "/pedidos" },
  { label: "Admin", to: "/admin" },
];

function Header() {
  const {
    cartCount,
    setIsCartOpen,
    theme,
    toggleTheme,
  } = useTechStore();

  return (
    <header className="header">
      <div className="header-inner">
        <NavLink className="brand" to="/" aria-label="Ir al inicio">
          <span className="brand-icon">T</span>

          <div>
            <h1>TechStore</h1>
            <p>Tecnología para todos</p>
          </div>
        </NavLink>

        <nav className="navigation" aria-label="Navegación principal">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <button
            className="theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === "dark"
                ? "Cambiar a modo claro"
                : "Cambiar a modo oscuro"
            }
            title={
              theme === "dark"
                ? "Cambiar a modo claro"
                : "Cambiar a modo oscuro"
            }
          >
            <span className="theme-toggle-icon" aria-hidden="true">
              {theme === "dark" ? "☀️" : "🌙"}
            </span>

            <span className="theme-toggle-text">
              {theme === "dark" ? "Claro" : "Oscuro"}
            </span>
          </button>

          <button
            className="cart-button"
            type="button"
            onClick={() => setIsCartOpen(true)}
          >
            Carrito ({cartCount})
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
