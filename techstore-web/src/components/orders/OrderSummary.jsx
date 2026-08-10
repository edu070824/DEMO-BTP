import { motion } from "motion/react";
import { orderPanelVariants } from "../../animations/variants";
import { useTechStore } from "../../hooks/useTechStore";
import { formatPrice, productIcons } from "../../utils/products";

function OrderSummary() {
  const {
    cart,
    cartTotal,
    orderCurrency,
    selectedCustomer,
  } = useTechStore();

  return (
    <motion.aside
      className="final-order-summary"
      variants={orderPanelVariants}
      transition={{ delay: 0.1 }}
    >
      <span className="summary-card-accent" aria-hidden="true" />

      <div className="final-summary-header">
        <div>
          <span>RESUMEN EN VIVO</span>
          <h3>Detalle del pedido</h3>
        </div>
        <small>
          {cart.length} {cart.length === 1 ? "producto" : "productos"}
        </small>
      </div>

      <div
        className={`final-customer ${
          selectedCustomer ? "has-customer" : "is-empty"
        }`}
      >
        <div className="final-customer-avatar" aria-hidden="true">
          {selectedCustomer ? selectedCustomer.name.charAt(0) : "?"}
        </div>
        <div>
          <span>CLIENTE</span>
          {selectedCustomer ? (
            <>
              <strong>{selectedCustomer.name}</strong>
              <small>{selectedCustomer.id}</small>
            </>
          ) : (
            <>
              <strong>Cliente pendiente</strong>
              <p>Selecciona una empresa para continuar</p>
            </>
          )}
        </div>
        <span
          className={`final-customer-state ${
            selectedCustomer ? "is-complete" : ""
          }`}
          aria-hidden="true"
        >
          {selectedCustomer ? "✓" : "!"}
        </span>
      </div>

      <div className="final-items-label">
        <span>PRODUCTOS</span>
        <small>
          {cart.reduce((total, item) => total + item.quantity, 0)} unidades
        </small>
      </div>

      <div className="final-order-items">
        {cart.length === 0 ? (
          <div className="empty-order-items">
            <span aria-hidden="true">＋</span>
            <strong>Aún no hay productos</strong>
            <p>Agrega artículos del catálogo para completar el pedido.</p>
          </div>
        ) : (
          cart.map((item) => (
            <article className="final-order-item" key={item.id}>
              <span className="final-order-item-icon" aria-hidden="true">
                {productIcons[item.category] || "📦"}
              </span>

              <div className="final-order-item-copy">
                <span>{item.id}</span>
                <strong>{item.name}</strong>
                <small>
                  {item.quantity} ×{" "}
                  {formatPrice(item.price, item.currency)}
                </small>
              </div>

              <strong className="final-order-item-price">
                {formatPrice(
                  item.price * item.quantity,
                  item.currency,
                )}
              </strong>
            </article>
          ))
        )}
      </div>

      <div className="final-order-total">
        <div>
          <span>TOTAL DEL PEDIDO</span>
          <small>Impuestos incluidos</small>
        </div>
        <strong>{formatPrice(cartTotal, orderCurrency)}</strong>
      </div>

      <div className="sap-structure-preview">
        <div className="sap-preview-title">
          <span>INTEGRACIÓN ACTIVA</span>
          <small>
            <i aria-hidden="true" /> En línea
          </small>
        </div>

        <div className="sap-flow" aria-label="Flujo de integración">
          <span>TechStore</span>
          <i aria-hidden="true">→</i>
          <span>Integration Suite</span>
          <i aria-hidden="true">→</i>
          <span>MiniSAP</span>
        </div>
      </div>
    </motion.aside>
  );
}

export default OrderSummary;
