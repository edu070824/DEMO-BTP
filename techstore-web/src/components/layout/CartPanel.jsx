import { useNavigate } from "react-router-dom";
import { useTechStore } from "../../hooks/useTechStore";
import {
  formatPrice,
  getAvailableStock,
  productIcons,
} from "../../utils/products";

function CartPanel() {
  const navigate = useNavigate();
  const {
    cart,
    cartTotal,
    isCartOpen,
    removeFromCart,
    requestFlowNavigation,
    selectedCustomer,
    setIsCartOpen,
    updateCartQuantity,
  } = useTechStore();

  if (!isCartOpen) {
    return null;
  }

  function goToRoute(path) {
    if (!requestFlowNavigation(path)) {
      setIsCartOpen(false);
      return;
    }

    setIsCartOpen(false);
    navigate(path);
  }

  return (
    <div
      className="cart-overlay"
      role="presentation"
      onClick={() => setIsCartOpen(false)}
    >
      <aside
        className="cart-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cart-panel-header">
          <div>
            <span>TECHSTORE</span>
            <h2>Tu carrito</h2>
          </div>

          <button
            className="close-cart-button"
            type="button"
            aria-label="Cerrar carrito"
            onClick={() => setIsCartOpen(false)}
          >
            ×
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="empty-cart">
            <span>🛒</span>
            <h3>El carrito está vacío</h3>
            <p>Agrega productos desde el catálogo para crear un pedido.</p>

            <button type="button" onClick={() => goToRoute("/productos")}>
              Ver productos
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item) => (
                <article className="cart-item" key={item.id}>
                  <div className="cart-item-icon">
                    {productIcons[item.category] ?? "📦"}
                  </div>

                  <div className="cart-item-information">
                    <span>{item.id}</span>
                    <h3>{item.name}</h3>

                    <p>
                      {formatPrice(item.price, item.currency)} por unidad
                    </p>

                    <div className="quantity-control">
                      <button
                        type="button"
                        aria-label={`Disminuir cantidad de ${item.name}`}
                        onClick={() =>
                          updateCartQuantity(item.id, item.quantity - 1)
                        }
                      >
                        −
                      </button>

                      <strong>{item.quantity}</strong>

                      <button
                        type="button"
                        aria-label={`Aumentar cantidad de ${item.name}`}
                        disabled={
                          item.quantity >= getAvailableStock(item)
                        }
                        onClick={() =>
                          updateCartQuantity(item.id, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-actions">
                    <strong>
                      {formatPrice(
                        item.price * item.quantity,
                        item.currency,
                      )}
                    </strong>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="cart-order-summary">
              <div className="cart-customer-summary">
                <span>Cliente del pedido</span>

                {selectedCustomer ? (
                  <>
                    <strong>{selectedCustomer.name}</strong>
                    <small>{selectedCustomer.id}</small>
                  </>
                ) : (
                  <p>Aún no has seleccionado un cliente.</p>
                )}
              </div>

              <div className="cart-total">
                <span>Total del pedido</span>

                <strong>
                  {formatPrice(
                    cartTotal,
                    cart[0]?.currency ?? "PEN",
                  )}
                </strong>
              </div>

              <p className="cart-next-step">
                En el siguiente paso enviaremos esta información al servicio de
                creación de pedidos.
              </p>

              <button
                className="continue-order-button"
                type="button"
                onClick={() => goToRoute("/pedidos")}
              >
                {selectedCustomer
                  ? "Continuar con el pedido"
                  : "Selecciona un cliente para continuar"}
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export default CartPanel;
