import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { productCardVariants } from "../../animations/variants";
import {
  formatPrice,
  getAvailableStock,
  productIcons,
} from "../../utils/products";

function ProductCard({ addToCart, prefersReducedMotion, product }) {
  const availableStock = getAvailableStock(product);
  const addedTimerRef = useRef(null);
  const [wasJustAdded, setWasJustAdded] = useState(false);

  useEffect(
    () => () => {
      if (addedTimerRef.current) {
        window.clearTimeout(addedTimerRef.current);
      }
    },
    [],
  );

  function handleAddToCart() {
    const productWasAdded = addToCart(product);

    if (!productWasAdded) {
      return;
    }

    if (addedTimerRef.current) {
      window.clearTimeout(addedTimerRef.current);
    }

    setWasJustAdded(true);
    addedTimerRef.current = window.setTimeout(() => {
      setWasJustAdded(false);
      addedTimerRef.current = null;
    }, 1700);
  }

  return (
    <motion.article
      className={`product-card ${wasJustAdded ? "is-just-added" : ""}`}
      variants={productCardVariants}
      whileHover={
        prefersReducedMotion
          ? undefined
          : { y: -9, transition: { duration: 0.22 } }
      }
    >
      <div className="product-image">
        <div className="product-image-glow" aria-hidden="true" />

        <span aria-hidden="true">
          {productIcons[product.category] ?? "📦"}
        </span>

        <small>{product.id}</small>

        <AnimatePresence>
          {wasJustAdded && (
            <motion.div
              animate={{ opacity: 1, scale: 1, x: "-50%", y: 0 }}
              className="product-added-burst"
              exit={{ opacity: 0, scale: 0.9, x: "-50%", y: -8 }}
              initial={
                prefersReducedMotion
                  ? false
                  : { opacity: 0, scale: 0.72, x: "-50%", y: 10 }
              }
            >
              <span aria-hidden="true">✓</span>
              <strong>Producto agregado</strong>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="product-card-body">
        <span className="product-category">{product.category}</span>

        <h3>{product.name}</h3>

        <p className="product-description">{product.description}</p>

        <div className="product-meta">
          <div>
            <span className="product-price">
              {formatPrice(product.price, product.currency)}
            </span>

            <span className="product-stock">
              {availableStock} disponibles
            </span>
          </div>

          <motion.button
            className="add-cart-button"
            type="button"
            disabled={availableStock === 0}
            onClick={handleAddToCart}
            whileTap={
              availableStock > 0 && !prefersReducedMotion
                ? { scale: 0.96 }
                : undefined
            }
            aria-label={
              availableStock > 0
                ? `Agregar ${product.name} al carrito`
                : `${product.name} sin stock`
            }
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                initial={{ opacity: 0, y: 5 }}
                key={wasJustAdded ? "added" : "idle"}
              >
                {availableStock === 0
                  ? "Sin stock"
                  : wasJustAdded
                    ? "¡Agregado!"
                    : "Agregar"}
              </motion.span>
            </AnimatePresence>

            {availableStock > 0 && (
              <span className="add-cart-icon" aria-hidden="true">
                {wasJustAdded ? "✓" : "+"}
              </span>
            )}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

export default ProductCard;
