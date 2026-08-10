import { motion, useReducedMotion } from "motion/react";
import {
  catalogGridVariants,
  sectionHeadingVariants,
} from "../animations/variants";
import ProductCard from "../components/products/ProductCard";
import { useTechStore } from "../hooks/useTechStore";

function ProductsView() {
  const prefersReducedMotion = useReducedMotion();
  const {
    activeProducts,
    addToCart,
    isLoadingProducts,
    productsError,
  } = useTechStore();

  return (
    <motion.section
      className="catalog-section route-section"
      id="productos"
      initial={prefersReducedMotion ? false : "hidden"}
      animate="visible"
    >
      <motion.div
        className="section-heading catalog-heading"
        variants={sectionHeadingVariants}
      >
        <span>CATÁLOGO</span>
        <h2>Productos disponibles</h2>
        <p>
          Productos obtenidos en tiempo real desde SAP mediante Integration
          Suite.
        </p>
      </motion.div>

      {isLoadingProducts && (
        <p className="status-message">Cargando productos desde SAP...</p>
      )}

      {productsError && (
        <p className="error-message">{productsError}</p>
      )}

      {!isLoadingProducts &&
        !productsError &&
        activeProducts.length === 0 && (
          <p className="status-message">
            No existen productos activos disponibles.
          </p>
        )}

      <motion.div className="product-grid" variants={catalogGridVariants}>
        {activeProducts.map((product) => (
          <ProductCard
            addToCart={addToCart}
            key={product.id}
            prefersReducedMotion={prefersReducedMotion}
            product={product}
          />
        ))}
      </motion.div>
    </motion.section>
  );
}

export default ProductsView;
