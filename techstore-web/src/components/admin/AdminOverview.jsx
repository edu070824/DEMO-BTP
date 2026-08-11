import { motion } from "motion/react";
import AdminIcon from "./AdminIcon";

function AdminOverview({
  customerCount,
  onNavigate,
  productCount,
  records,
}) {
  const metrics = [
    {
      accent: "blue",
      icon: "box",
      label: "Productos visibles",
      value: productCount,
      detail: "Sincronizados con SAP",
    },
    {
      accent: "violet",
      icon: "users",
      label: "Clientes activos",
      value: customerCount,
      detail: "Disponibles para pedidos",
    },
    {
      accent: "cyan",
      icon: "database",
      label: "Integración",
      value: "Online",
      detail: "SAP Integration Suite activa",
    },
    {
      accent: "green",
      icon: "activity",
      label: "Registros",
      value: records.length,
      detail: "Creados desde el panel",
    },
  ];

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="admin-panel-view"
      initial={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.35 }}
    >
      {/* =====================================================
          ENCABEZADO
          ===================================================== */}

      <div className="admin-view-heading">
        <div>
          <span>PANORAMA GENERAL</span>

          <h2>Todo bajo control</h2>

          <p>
            Revisa el estado actual de TechStore y administra
            productos y clientes conectados con SAP.
          </p>
        </div>

        <div className="admin-live-chip">
          <span />
          Integración activa
        </div>
      </div>

      {/* =====================================================
          MÉTRICAS
          ===================================================== */}

      <div className="admin-metric-grid">
        {metrics.map((metric, index) => (
          <motion.article
            animate={{
              opacity: 1,
              y: 0,
            }}
            className={`admin-metric-card admin-metric-${metric.accent}`}
            initial={{
              opacity: 0,
              y: 16,
            }}
            key={metric.label}
            transition={{
              delay: index * 0.06,
              duration: 0.35,
            }}
          >
            <div className="admin-metric-top">
              <span className="admin-metric-icon">
                <AdminIcon
                  name={metric.icon}
                  size={21}
                />
              </span>

              <span className="admin-metric-trend">
                Actual
              </span>
            </div>

            <strong>
              {metric.value}
            </strong>

            <span>
              {metric.label}
            </span>

            <small>
              {metric.detail}
            </small>
          </motion.article>
        ))}
      </div>

      {/* =====================================================
          CONTENIDO INFERIOR
          ===================================================== */}

      <div className="admin-overview-grid">

        {/* ===================================================
            ACCESOS RÁPIDOS
            =================================================== */}

        <section className="admin-quick-actions">
          <div className="admin-block-heading">
            <div>
              <span>
                ACCESOS RÁPIDOS
              </span>

              <h3>
                ¿Qué deseas registrar?
              </h3>
            </div>
          </div>

          <div className="admin-action-grid">

            {/* Nuevo producto */}

            <button
              onClick={() =>
                onNavigate("product")
              }
              type="button"
            >
              <span className="admin-action-icon admin-action-product">
                <AdminIcon
                  name="box"
                  size={24}
                />
              </span>

              <span>
                <strong>
                  Nuevo producto
                </strong>

                <small>
                  Registra precio, stock y categoría
                </small>
              </span>

              <span className="admin-action-arrow">
                <AdminIcon
                  name="chevron"
                  size={18}
                />
              </span>
            </button>

            {/* Nuevo cliente */}

            <button
              onClick={() =>
                onNavigate("customer")
              }
              type="button"
            >
              <span className="admin-action-icon admin-action-customer">
                <AdminIcon
                  name="users"
                  size={24}
                />
              </span>

              <span>
                <strong>
                  Nuevo cliente
                </strong>

                <small>
                  Registra datos fiscales y contacto
                </small>
              </span>

              <span className="admin-action-arrow">
                <AdminIcon
                  name="chevron"
                  size={18}
                />
              </span>
            </button>
          </div>
        </section>

        {/* ===================================================
            ACTIVIDAD RECIENTE
            =================================================== */}

        <section className="admin-activity-card">
          <div className="admin-block-heading admin-activity-heading">
            <div>
              <span>
                ACTIVIDAD RECIENTE
              </span>

              <h3>
                Registros creados
              </h3>
            </div>

            <span className="admin-record-count">
              {records.length}
            </span>
          </div>

          {records.length === 0 ? (
            <div className="admin-empty-activity">
              <span>
                <AdminIcon
                  name="clock"
                  size={24}
                />
              </span>

              <strong>
                Aún no hay registros
              </strong>

              <p>
                Los productos y clientes creados
                correctamente desde este panel
                aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="admin-record-list">
              {records.map((record) => (
                <article key={record.key}>
                  <span
                    className={`admin-record-icon is-${record.type}`}
                  >
                    <AdminIcon
                      name={
                        record.type === "product"
                          ? "box"
                          : "users"
                      }
                      size={17}
                    />
                  </span>

                  <div>
                    <strong>
                      {record.name}
                    </strong>

                    <small>
                      {record.id} · {record.time}
                    </small>
                  </div>

                  <span className="admin-record-status">
                    <AdminIcon
                      name="check"
                      size={14}
                    />

                    Registrado
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}

export default AdminOverview;