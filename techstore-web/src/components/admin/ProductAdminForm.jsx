import { motion } from "motion/react";
import { formatPrice, productIcons } from "../../utils/products";
import AdminIcon from "./AdminIcon";

function ProductAdminForm({
  form,
  isSubmitting,
  onChange,
  onReset,
  onSubmit,
  result,
}) {
  const price = Number(form.price) || 0;
  const stock = Number(form.stock) || 0;
  const reservedStock = Number(form.reservedStock) || 0;

  const availableStock = Math.max(
    stock - reservedStock,
    0,
  );

  const productResult =
    result?.type === "product"
      ? result
      : null;

  const isSuccess =
    productResult?.status === "success";

  const isError =
    productResult?.status === "error";

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
          <span>GESTIÓN DE CATÁLOGO</span>

          <h2>Registrar nuevo producto</h2>

          <p>
            Completa la ficha del producto y publícala
            directamente en SAP mediante Integration Suite.
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
          RESULTADO DEL REGISTRO
          ===================================================== */}

      {productResult && (
        <motion.div
          animate={{
            opacity: 1,
            y: 0,
          }}
          className={`admin-result-banner ${
            isError ? "is-error" : ""
          }`}
          initial={{
            opacity: 0,
            y: -8,
          }}
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
                ? "Producto registrado"
                : "No se pudo registrar el producto"}
            </strong>

            <p>
              {productResult.message}
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
            <span className="admin-form-heading-icon">
              <AdminIcon
                name="box"
                size={22}
              />
            </span>

            <div>
              <span>
                INFORMACIÓN DEL PRODUCTO
              </span>

              <h3>Datos principales</h3>
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
                Código del producto *
              </span>

              <input
  disabled={isSubmitting}
  maxLength={10}
  name="id"
  onChange={onChange}
  placeholder="PROD000005"
  required
  type="text"
  value={form.id}
/>

              <small>
                Identificador único utilizado por SAP.
              </small>
            </label>


            {/* Categoría */}

            <label className="admin-field">
              <span>Categoría *</span>

              <select
                disabled={isSubmitting}
                name="category"
                onChange={onChange}
                required
                value={form.category}
              >
                <option value="LAPTOPS">
                  Laptops
                </option>

                <option value="MONITORES">
                  Monitores
                </option>

                <option value="ACCESORIOS">
                  Accesorios
                </option>

                <option value="TECNOLOGICO">
                  Tecnológico
                </option>

                <option value="AUDIFONOS">
                  Audífonos
                </option>
              </select>
            </label>


            {/* Nombre */}

            <label className="admin-field admin-field-wide">
              <span>
                Nombre comercial *
              </span>

              <input
                disabled={isSubmitting}
                name="name"
                onChange={onChange}
                placeholder="Ej. Mouse Gamer Pro"
                required
                type="text"
                value={form.name}
              />
            </label>


            {/* Descripción */}

            <label className="admin-field admin-field-wide">
              <span>Descripción *</span>

              <textarea
                disabled={isSubmitting}
                maxLength="120"
                name="description"
                onChange={onChange}
                placeholder="Describe las características principales..."
                required
                rows="3"
                value={form.description}
              />

              <small className="admin-character-count">
                {form.description.length}/120 caracteres
              </small>
            </label>


            {/* Precio */}

            <label className="admin-field">
              <span>Precio *</span>

              <div className="admin-input-prefix">
                <span>
                  {form.currency === "USD"
                    ? "$"
                    : "S/"}
                </span>

                <input
                  disabled={isSubmitting}
                  min="0"
                  name="price"
                  onChange={onChange}
                  required
                  step="0.01"
                  type="number"
                  value={form.price}
                />
              </div>
            </label>


            {/* Moneda */}

            <label className="admin-field">
              <span>Moneda *</span>

              <select
                disabled={isSubmitting}
                name="currency"
                onChange={onChange}
                required
                value={form.currency}
              >
                <option value="PEN">
                  PEN · Sol peruano
                </option>

                <option value="USD">
                  USD · Dólar estadounidense
                </option>
              </select>
            </label>


            {/* Stock */}

            <label className="admin-field">
              <span>Stock total *</span>

              <input
                disabled={isSubmitting}
                min="0"
                name="stock"
                onChange={onChange}
                required
                step="1"
                type="number"
                value={form.stock}
              />
            </label>


            {/* Stock reservado */}

            <label className="admin-field">
              <span>
                Stock reservado
              </span>

              <input
                disabled={isSubmitting}
                min="0"
                name="reservedStock"
                onChange={onChange}
                step="1"
                type="number"
                value={form.reservedStock}
              />
            </label>
          </div>


          {/* =================================================
              ESTADO ACTIVO
              ================================================= */}

          <label className="admin-switch-row">
            <span>
              <strong>
                Producto visible
              </strong>

              <small>
                Mostrarlo en el catálogo para
                los usuarios.
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
                : "Registrar producto"}
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
              Catálogo de usuarios
            </small>
          </div>


          <article className="admin-product-preview">

            {/* Imagen / cabecera */}

            <div className="admin-product-preview-image">
              <span className="admin-preview-code">
                {form.id || "SIN CÓDIGO"}
              </span>

              <span
                className="admin-product-emoji"
                aria-hidden="true"
              >
                {productIcons[
                  form.category
                ] ?? "📦"}
              </span>

              <span
                className={`admin-visibility-pill ${
                  form.active
                    ? "is-visible"
                    : ""
                }`}
              >
                <span />

                {form.active
                  ? "Visible"
                  : "Oculto"}
              </span>
            </div>


            {/* Información */}

            <div className="admin-product-preview-body">
              <span className="admin-preview-category">
                {form.category ||
                  "CATEGORÍA"}
              </span>

              <h3>
                {form.name ||
                  "Nombre del producto"}
              </h3>

              <p>
                {form.description ||
                  "La descripción aparecerá en este espacio."}
              </p>


              <div className="admin-product-preview-footer">
                <div>
                  <strong>
                    {formatPrice(
                      price,
                      form.currency,
                    )}
                  </strong>

                  <span>
                    {availableStock} disponibles
                  </span>
                </div>

                <button
                  disabled
                  type="button"
                >
                  Agregar <span>+</span>
                </button>
              </div>
            </div>
          </article>


          {/* =================================================
              INFORMACIÓN DE INTEGRACIÓN
              ================================================= */}

          <div className="admin-preview-info">
            <AdminIcon
              name="database"
              size={18}
            />

            <p>
              Al registrar el producto, TechStore
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

export default ProductAdminForm;