import { formatPrice } from "../../utils/products";

function OrderAssistantSummary({ draft }) {
  if (!draft.product || !draft.customer || !draft.seller) {
    return null;
  }

  const total = draft.product.price * draft.quantity;

  return (
    <section className="assistant-order-summary" aria-label="Resumen del pedido">
      <div className="assistant-summary-heading">
        <span>RESUMEN DEL PEDIDO</span>
        <strong>Listo para confirmar</strong>
      </div>

      <div className="assistant-summary-product">
        <span aria-hidden="true">▣</span>
        <div>
          <small>{draft.product.id}</small>
          <strong>{draft.product.name}</strong>
          <p>
            {draft.quantity} × {formatPrice(draft.product.price, draft.product.currency)}
          </p>
        </div>
      </div>

      <dl>
        <div>
          <dt>Cliente</dt>
          <dd>{draft.customer.name}</dd>
        </div>
        <div>
          <dt>Vendedor</dt>
          <dd>{draft.seller}</dd>
        </div>
        <div>
          <dt>Observación</dt>
          <dd>{draft.observation || "Sin observación"}</dd>
        </div>
      </dl>

      <div className="assistant-summary-total">
        <span>Total estimado</span>
        <strong>{formatPrice(total, draft.product.currency)}</strong>
      </div>
    </section>
  );
}

export default OrderAssistantSummary;
