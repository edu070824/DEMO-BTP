import AdminIcon from "./AdminIcon";

const navigationItems = [
  {
    id: "overview",
    icon: "dashboard",
    label: "Resumen",
    description: "Estado general",
  },
  {
    id: "product",
    icon: "box",
    label: "Nuevo producto",
    description: "Crear en SAP",
  },
  {
    id: "customer",
    icon: "users",
    label: "Nuevo cliente",
    description: "Registrar en SAP",
  },
];

function AdminSidebar({
  activeSection,
  onNavigate,
}) {
  return (
    <aside className="admin-sidebar">

      {/* =====================================================
          IDENTIDAD DEL PANEL
          ===================================================== */}

      <div className="admin-sidebar-brand">
        <span className="admin-sidebar-brand-icon">
          <AdminIcon
            name="shield"
            size={21}
          />
        </span>

        <div>
          <strong>Panel Admin</strong>
          <span>TechStore</span>
        </div>
      </div>


      {/* =====================================================
          NAVEGACIÓN
          ===================================================== */}

      <div
        className="admin-sidebar-menu"
        role="tablist"
      >
        {navigationItems.map((item) => (
          <button
            aria-selected={
              activeSection === item.id
            }
            className={
              activeSection === item.id
                ? "is-active"
                : ""
            }
            key={item.id}
            onClick={() =>
              onNavigate(item.id)
            }
            role="tab"
            type="button"
          >
            <span className="admin-sidebar-icon">
              <AdminIcon
                name={item.icon}
                size={19}
              />
            </span>

            <span className="admin-sidebar-copy">
              <strong>
                {item.label}
              </strong>

              <small>
                {item.description}
              </small>
            </span>

            <AdminIcon
              name="chevron"
              size={16}
            />
          </button>
        ))}
      </div>


      {/* =====================================================
          ESTADO DE INTEGRACIÓN
          Conservamos admin-demo-note para aprovechar
          los estilos existentes de admin.css.
          ===================================================== */}

      <div className="admin-demo-note">
        <span className="admin-demo-note-icon">
          <AdminIcon
            name="database"
            size={18}
          />
        </span>

        <div>
          <strong>
            Integración activa
          </strong>

          <p>
            Productos y clientes se registran
            en SAP mediante Integration Suite.
          </p>
        </div>
      </div>

    </aside>
  );
}

export default AdminSidebar;