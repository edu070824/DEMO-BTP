import { useTechStore } from "../../hooks/useTechStore";

function OrderProgress() {
  const { canCreateOrder, cart, selectedCustomer } = useTechStore();

  return (
    <div className="order-progress" aria-label="Progreso del pedido">
      <div
        className={`order-progress-step ${
          selectedCustomer ? "is-complete" : "is-pending"
        }`}
      >
        <span>01</span>
        <div>
          <strong>Cliente</strong>
          <small>{selectedCustomer ? "Seleccionado" : "Pendiente"}</small>
        </div>
      </div>

      <span
        className={`order-progress-line ${
          selectedCustomer ? "is-complete" : ""
        }`}
        aria-hidden="true"
      />

      <div
        className={`order-progress-step ${
          cart.length > 0 ? "is-complete" : "is-pending"
        }`}
      >
        <span>02</span>
        <div>
          <strong>Productos</strong>
          <small>
            {cart.length > 0
              ? `${cart.length} ${
                  cart.length === 1 ? "agregado" : "agregados"
                }`
              : "Pendiente"}
          </small>
        </div>
      </div>

      <span
        className={`order-progress-line ${
          cart.length > 0 ? "is-complete" : ""
        }`}
        aria-hidden="true"
      />

      <div
        className={`order-progress-step ${
          canCreateOrder ? "is-ready" : "is-pending"
        }`}
      >
        <span>03</span>
        <div>
          <strong>Envío SAP</strong>
          <small>{canCreateOrder ? "Listo para enviar" : "Por validar"}</small>
        </div>
      </div>
    </div>
  );
}

export default OrderProgress;
