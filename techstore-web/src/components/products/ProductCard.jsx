import { motion } from "motion/react";
import { productCardVariants } from "../../animations/variants";
import {
  formatPrice,
  getAvailableStock,
  productIcons,
} from "../../utils/products";

function ProductCard({ addToCart, prefersReducedMotion, product }) {
  const availableStock = getAvailableStock(product);

  return (
    <motion.article
      className="product-card"
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
            onClick={() => addToCart(product)}
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
            <span>{availableStock > 0 ? "Agregar" : "Sin stock"}</span>

            {availableStock > 0 && (
              <span className="add-cart-icon" aria-hidden="true">+</span>
            )}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

export default ProductCard;
