import { motion, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { orderPanelVariants } from "../../animations/variants";
import { useTechStore } from "../../hooks/useTechStore";

function OrderForm() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const {
    canCreateOrder,
    cart,
    handleCreateOrder,
    isCreatingOrder,
    observation,
    orderCurrency,
    orderResponse,
    selectedCustomer,
    seller,
    setObservation,
    setSeller,
  } = useTechStore();

  return (
    <motion.form
      className="order-form"
      onSubmit={handleCreateOrder}
      variants={orderPanelVariants}
    >
      <span className="order-card-accent" aria-hidden="true" />

      <div className="order-form-header">
        <div className="order-form-title-row">
          <span className="order-form-icon" aria-hidden="true">✦</span>
          <div>
            <span>DATOS DE CABECERA</span>
            <h3>Información general</h3>
          </div>
        </div>

        <div className="order-status-badge">
          <i aria-hidden="true" />
          Integration Suite
        </div>
      </div>

      <div className="order-fields">
        <div className="form-field form-field-full">
          <div className="field-label-row">
            <label htmlFor="order-customer">Cliente del pedido</label>
            <small>Obligatorio</small>
          </div>

          <div
            className={`input-shell ${
              !selectedCustomer ? "input-shell-warning" : "input-shell-ready"
            }`}
          >
            <span className="field-leading-icon" aria-hidden="true">ID</span>
            <input
              id="order-customer"
              type="text"
              value={
                selectedCustomer
                  ? `${selectedCustomer.id} - ${selectedCustomer.name}`
                  : ""
              }
              placeholder="Selecciona un cliente"
              readOnly
            />
            {selectedCustomer && (
              <span className="field-state-icon" aria-hidden="true">✓</span>
            )}
          </div>

          {!selectedCustomer && (
            <small className="field-warning">
              <span aria-hidden="true">!</span>
              Debes seleccionar un cliente antes de crear el pedido.
            </small>
          )}
        </div>

        <div className="form-field">
          <div className="field-label-row">
            <label htmlFor="order-seller">Vendedor</label>
            <small>Máx. 20 caracteres</small>
          </div>

          <div className="input-shell">
            <span className="field-leading-icon" aria-hidden="true">VE</span>
            <input
              id="order-seller"
              type="text"
              value={seller}
              maxLength={20}
              placeholder="Ejemplo: VENDEDOR01"
              onChange={(event) => setSeller(event.target.value)}
            />
          </div>
        </div>

        <div className="form-field">
          <div className="field-label-row">
            <label htmlFor="order-currency">Moneda</label>
            <small>Automática</small>
          </div>

          <div className="input-shell input-shell-readonly">
            <span className="field-leading-icon" aria-hidden="true">S/</span>
            <input
              id="order-currency"
              type="text"
              value={orderCurrency}
              readOnly
            />
            <span className="field-lock" aria-hidden="true">•</span>
          </div>
        </div>

        <div className="form-field form-field-full">
          <div className="field-label-row">
            <label htmlFor="order-observation">Observación</label>
            <small>Se enviará a SAP</small>
          </div>

          <div className="input-shell textarea-shell">
            <span className="field-leading-icon" aria-hidden="true">TXT</span>
            <textarea
              id="order-observation"
              rows="4"
              value={observation}
              placeholder="Ingresa una observación para el pedido"
              onChange={(event) => setObservation(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={`order-readiness ${canCreateOrder ? "is-ready" : ""}`}>
        <div className="order-readiness-copy">
          <span>VALIDACIÓN DEL PEDIDO</span>
          <strong>
            {canCreateOrder
              ? "Todo está listo para continuar"
              : "Completa los datos pendientes"}
          </strong>
        </div>

        <div className="order-readiness-checks">
          <span className={selectedCustomer ? "is-complete" : ""}>
            {selectedCustomer ? "✓" : "○"} Cliente
          </span>
          <span className={cart.length > 0 ? "is-complete" : ""}>
            {cart.length > 0 ? "✓" : "○"} Productos
          </span>
          <span className={seller.trim() ? "is-complete" : ""}>
            {seller.trim() ? "✓" : "○"} Vendedor
          </span>
        </div>
      </div>

      <div className="order-form-actions">
        <button
          className="secondary-order-button"
          type="button"
          onClick={() => navigate("/productos")}
        >
          <span className="button-icon" aria-hidden="true">↗</span>
          Modificar productos
        </button>

        <button
          className="create-order-button"
          type="submit"
          disabled={!canCreateOrder || isCreatingOrder}
        >
          <span>
            {isCreatingOrder ? "Creando pedido..." : "Crear pedido en SAP"}
          </span>
          <span className="button-arrow" aria-hidden="true">
            {isCreatingOrder ? "…" : "→"}
          </span>
        </button>
      </div>

      {!canCreateOrder && (
        <p className="order-validation-message">
          <span aria-hidden="true">!</span>
          Para continuar necesitas seleccionar un cliente, agregar al menos un
          producto e ingresar el vendedor.
        </p>
      )}

      {orderResponse && (
        <motion.div
          className={`order-result ${
            orderResponse.TYPE?.trim().toUpperCase() === "S"
              ? "order-result-success"
              : "order-result-error"
          }`}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38 }}
        >
          <div className="order-result-icon">
            {orderResponse.TYPE?.trim().toUpperCase() === "S" ? "✓" : "!"}
          </div>

          <div>
            <span>
              {orderResponse.TYPE?.trim().toUpperCase() === "S"
                ? "Pedido creado correctamente"
                : "No fue posible crear el pedido"}
            </span>

            {orderResponse.TYPE?.trim().toUpperCase() === "S" &&
              orderResponse.EV_ID_PEDIDO && (
                <h4>{orderResponse.EV_ID_PEDIDO}</h4>
              )}

            <p>{orderResponse.MESSAGE}</p>
          </div>
        </motion.div>
      )}
    </motion.form>
  );
}

export default OrderForm;
