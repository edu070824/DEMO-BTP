import { motion } from "motion/react";
import AdminIcon from "./AdminIcon";

function CustomerAdminForm({
  form,
  isSubmitting,
  onChange,
  onReset,
  onSubmit,
  result,
}) {
  const initial =
    form.name.trim().charAt(0).toUpperCase() || "N";

  const customerResult =
    result?.type === "customer"
      ? result
      : null;

  const isSuccess =
    customerResult?.status === "success";

  const isError =
    customerResult?.status === "error";

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
          <span>GESTIÓN DE CLIENTES</span>

          <h2>Registrar nuevo cliente</h2>

          <p>
            Completa los datos fiscales y de contacto
            del cliente y regístralo directamente en SAP.
          </p>
        </div>

        <div className="admin-draft-chip">
          <AdminIcon
            name={isSubmitting ? "refresh" : "database"}
            size={16}
          />

          {isSubmitting
            ? "Enviando a SAP..."
            : "Integración activa"}
        </div>
      </div>

      {/* =====================================================
          RESULTADO
          ===================================================== */}

      {customerResult && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={`admin-result-banner ${
            isError ? "is-error" : ""
          }`}
          initial={{ opacity: 0, y: -8 }}
          role={isError ? "alert" : "status"}
        >
          <span>
            <AdminIcon
              name={
                isSuccess
                  ? "check"
                  : "activity"
              }
              size={18}
            />
          </span>

          <div>
            <strong>
              {isSuccess
                ? "Cliente registrado"
                : "No se pudo registrar el cliente"}
            </strong>

            <p>
              {customerResult.message}
            </p>
          </div>
        </motion.div>
      )}

      {/* =====================================================
          EDITOR
          ===================================================== */}

      <div className="admin-editor-layout">

        {/* ===================================================
            FORMULARIO
            =================================================== */}

        <form
          className="admin-form-card"
          onSubmit={onSubmit}
        >
          <div className="admin-form-card-heading">
            <span className="admin-form-heading-icon admin-customer-form-icon">
              <AdminIcon
                name="users"
                size={22}
              />
            </span>

            <div>
              <span>
                INFORMACIÓN DEL CLIENTE
              </span>

              <h3>Datos de la empresa</h3>
            </div>

            <span className="admin-required-note">
              * Obligatorio
            </span>
          </div>

          {/* =================================================
              CAMPOS
              ================================================= */}

          <div className="admin-form-grid">

            {/* Código */}

            <label className="admin-field">
              <span>
                Código del cliente *
              </span>

              <input
  disabled={isSubmitting}
  maxLength={10}
  name="id"
  onChange={onChange}
  placeholder="CLI0000005"
  required
  type="text"
  value={form.id}
/>

              <small>
                Identificador único utilizado por SAP.
              </small>
            </label>

            {/* Tipo de documento */}

            <label className="admin-field">
              <span>
                Tipo de documento *
              </span>

              <select
                disabled={isSubmitting}
                name="documentType"
                onChange={onChange}
                required
                value={form.documentType}
              >
                <option value="RUC">
                  RUC
                </option>

                <option value="DNI">
                  DNI
                </option>

                <option value="CE">
                  Carné de extranjería
                </option>
              </select>
            </label>

            {/* Razón social */}

            <label className="admin-field admin-field-wide">
              <span>
                Razón social *
              </span>

              <input
                disabled={isSubmitting}
                name="name"
                onChange={onChange}
                placeholder="Ej. Comercial Lima SAC"
                required
                type="text"
                value={form.name}
              />
            </label>

            {/* Número documento */}

            <label className="admin-field">
              <span>
                Número de documento *
              </span>

              <input
                disabled={isSubmitting}
                inputMode="numeric"
                name="documentNumber"
                onChange={onChange}
                placeholder="20607894561"
                required
                type="text"
                value={form.documentNumber}
              />
            </label>

            {/* Teléfono */}

            <label className="admin-field">
              <span>
                Teléfono *
              </span>

              <input
                disabled={isSubmitting}
                inputMode="tel"
                name="phone"
                onChange={onChange}
                placeholder="956123789"
                required
                type="tel"
                value={form.phone}
              />
            </label>

            {/* Correo */}

            <label className="admin-field admin-field-wide">
              <span>
                Correo corporativo *
              </span>

              <input
                disabled={isSubmitting}
                name="email"
                onChange={onChange}
                placeholder="ventas@empresa.com"
                required
                type="email"
                value={form.email}
              />
            </label>

            {/* Dirección */}

            <label className="admin-field admin-field-wide">
              <span>
                Dirección fiscal *
              </span>

              <input
                disabled={isSubmitting}
                name="address"
                onChange={onChange}
                placeholder="Av. Principal 123, Lima"
                required
                type="text"
                value={form.address}
              />
            </label>
          </div>

          {/* =================================================
              ESTADO ACTIVO
              ================================================= */}

          <label className="admin-switch-row">
            <span>
              <strong>
                Cliente activo
              </strong>

              <small>
                Permitir su selección al crear
                un pedido.
              </small>
            </span>

            <input
              checked={form.active}
              disabled={isSubmitting}
              name="active"
              onChange={onChange}
              type="checkbox"
            />

            <span
              className="admin-switch"
              aria-hidden="true"
            />
          </label>

          {/* =================================================
              ACCIONES
              ================================================= */}

          <div className="admin-form-actions">
            <button
              className="admin-secondary-button"
              disabled={isSubmitting}
              onClick={onReset}
              type="button"
            >
              <AdminIcon
                name="refresh"
                size={17}
              />

              Restablecer
            </button>

            <button
              className="admin-primary-button"
              disabled={isSubmitting}
              type="submit"
            >
              <AdminIcon
                name={
                  isSubmitting
                    ? "refresh"
                    : "database"
                }
                size={17}
              />

              {isSubmitting
                ? "Registrando..."
                : "Registrar cliente"}
            </button>
          </div>
        </form>

        {/* ===================================================
            VISTA PREVIA
            =================================================== */}

        <aside className="admin-preview-column">
          <div className="admin-preview-heading">
            <span>
              <AdminIcon
                name="eye"
                size={18}
              />

              VISTA PREVIA
            </span>

            <small>
              Selección de clientes
            </small>
          </div>

          <article className="admin-customer-preview">
            <div className="admin-customer-preview-accent" />

            <div className="admin-customer-preview-top">
              <span className="admin-customer-avatar">
                {initial}

                <i
                  className={
                    form.active
                      ? "is-active"
                      : ""
                  }
                />
              </span>

              <div>
                <span className="admin-customer-meta">
                  <small>
                    {form.id || "SIN CÓDIGO"}
                  </small>

                  <small
                    className={
                      form.active
                        ? "is-active"
                        : ""
                    }
                  >
                    <span />

                    {form.active
                      ? "Activo"
                      : "Inactivo"}
                  </small>
                </span>

                <h3>
                  {form.name ||
                    "Razón social del cliente"}
                </h3>
              </div>
            </div>

            <div className="admin-customer-detail-grid">

              {/* Documento */}

              <div>
                <span>#</span>

                <p>
                  <small>
                    {form.documentType}
                  </small>

                  <strong>
                    {form.documentNumber || "—"}
                  </strong>
                </p>
              </div>

              {/* Teléfono */}

              <div>
                <span>☎</span>

                <p>
                  <small>
                    TELÉFONO
                  </small>

                  <strong>
                    {form.phone || "—"}
                  </strong>
                </p>
              </div>

              {/* Correo */}

              <div className="is-wide">
                <span>@</span>

                <p>
                  <small>
                    CORREO
                  </small>

                  <strong>
                    {form.email || "—"}
                  </strong>
                </p>
              </div>

              {/* Dirección */}

              <div className="is-wide">
                <span>⌖</span>

                <p>
                  <small>
                    DIRECCIÓN
                  </small>

                  <strong>
                    {form.address || "—"}
                  </strong>
                </p>
              </div>
            </div>

            <button
              disabled
              type="button"
            >
              Seleccionar cliente{" "}
              <span>→</span>
            </button>
          </article>

          {/* =================================================
              INFO INTEGRACIÓN
              ================================================= */}

          <div className="admin-preview-info">
            <AdminIcon
              name="database"
              size={18}
            />

            <p>
              Al registrar el cliente, TechStore
              enviará estos datos al backend y
              posteriormente a SAP mediante
              Integration Suite.
            </p>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}

export default CustomerAdminForm;