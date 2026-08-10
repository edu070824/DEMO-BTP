import { motion, useReducedMotion } from "motion/react";
import { sectionHeadingVariants } from "../animations/variants";
import OrderForm from "../components/orders/OrderForm";
import OrderProgress from "../components/orders/OrderProgress";
import OrderSummary from "../components/orders/OrderSummary";

function OrdersView() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      className="order-section route-section"
      id="pedidos"
      initial={prefersReducedMotion ? false : "hidden"}
      animate="visible"
    >
      <motion.div className="order-heading" variants={sectionHeadingVariants}>
        <span>PEDIDO SAP</span>
        <h2>Confirma la información del pedido</h2>
        <p>
          Revisa los datos finales y envía una solicitud clara, completa y
          segura hacia SAP.
        </p>

        <OrderProgress />
      </motion.div>

      <div className="order-layout">
        <OrderForm />
        <OrderSummary />
      </div>
    </motion.section>
  );
}

export default OrdersView;
