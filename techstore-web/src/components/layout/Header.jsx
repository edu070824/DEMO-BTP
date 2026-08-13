import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTechStore } from "../../hooks/useTechStore";

const standardNavigationItems = [
  { label: "Inicio", to: "/" },
  { label: "Productos", to: "/productos" },
  { label: "Clientes", to: "/clientes" },
  { label: "Pedidos", to: "/pedidos" },
];

function Header() {
  const navigate = useNavigate();
  const accountMenuRef = useRef(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const { isAdmin, logout, user } = useAuth();
  const {
    cartCount,
    requestFlowNavigation,
    resetWorkspaceSession,
    setIsCartOpen,
    theme,
    toggleTheme,
  } = useTechStore();
  const navigationItems = isAdmin
    ? [...standardNavigationItems, { label: "Admin", to: "/admin" }]
    : standardNavigationItems;

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return undefined;
    }

    function handleOutsideClick(event) {
      if (!accountMenuRef.current?.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isAccountMenuOpen]);

  function handleLogout() {
    setIsAccountMenuOpen(false);
    resetWorkspaceSession();
    logout();
    navigate("/login", { replace: true });
  }

  function handleNavigation(event, destination) {
    if (!requestFlowNavigation(destination)) {
      event.preventDefault();
    }
  }

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
              onClick={(event) => handleNavigation(event, item.to)}
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

          <div className="account-menu" ref={accountMenuRef}>
            <button
              aria-expanded={isAccountMenuOpen}
              aria-haspopup="menu"
              aria-label="Abrir menú de la cuenta"
              className="account-trigger"
              onClick={() =>
                setIsAccountMenuOpen((currentValue) => !currentValue)
              }
              type="button"
            >
              <span>{user?.name?.charAt(0) || "T"}</span>
              <div>
                <strong>{isAdmin ? "Administrador" : "Usuario"}</strong>
                <small>{user?.email}</small>
              </div>
              <b aria-hidden="true">⌄</b>
            </button>

            {isAccountMenuOpen && (
              <div className="account-popover" role="menu">
                <div className="account-popover-profile">
                  <span>{user?.name?.charAt(0) || "T"}</span>
                  <div>
                    <strong>{user?.name}</strong>
                    <small>{isAdmin ? "Acceso administrador" : "Acceso usuario"}</small>
                  </div>
                </div>

                <button onClick={handleLogout} role="menuitem" type="button">
                  <span aria-hidden="true">↪</span>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
