import { motion, useReducedMotion } from "motion/react";
import {
  customerGridVariants,
  sectionHeadingVariants,
} from "../animations/variants";
import CustomerCard from "../components/customers/CustomerCard";
import { useTechStore } from "../hooks/useTechStore";

function CustomersView() {
  const prefersReducedMotion = useReducedMotion();
  const {
    activeCustomers,
    customersError,
    isLoadingCustomers,
    selectedCustomer,
    selectedCustomerId,
    selectCustomer,
  } = useTechStore();

  return (
    <motion.section
      className="customers-section route-section"
      id="clientes"
      initial={prefersReducedMotion ? false : "hidden"}
      animate="visible"
    >
      <motion.div
        className="section-heading customer-heading"
        variants={sectionHeadingVariants}
      >
        <span>CLIENTES SAP</span>
        <h2>Selecciona el cliente para tu pedido</h2>
        <p>
          Elige la empresa que recibirá el pedido. Su información se incorporará
          automáticamente a la cabecera enviada a SAP.
        </p>
      </motion.div>

      {isLoadingCustomers && (
        <p className="status-message">Cargando clientes desde SAP...</p>
      )}

      {customersError && (
        <p className="error-message">{customersError}</p>
      )}

      {!isLoadingCustomers &&
        !customersError &&
        activeCustomers.length === 0 && (
          <p className="status-message">
            No existen clientes activos disponibles.
          </p>
        )}

      <motion.div className="customer-grid" variants={customerGridVariants}>
        {activeCustomers.map((customer) => (
          <CustomerCard
            customer={customer}
            isSelected={customer.id === selectedCustomerId}
            key={customer.id}
            prefersReducedMotion={prefersReducedMotion}
            selectCustomer={selectCustomer}
          />
        ))}
      </motion.div>

      {selectedCustomer && (
        <motion.div
          className="selected-customer-summary"
          key={selectedCustomer.id}
          initial={
            prefersReducedMotion
              ? false
              : { opacity: 0, y: 14, scale: 0.985 }
          }
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="selected-customer-icon" aria-hidden="true">✓</span>

          <div>
            <span>Cliente listo para el pedido</span>
            <strong>{selectedCustomer.name}</strong>
          </div>

          <small>{selectedCustomer.id}</small>
        </motion.div>
      )}
    </motion.section>
  );
}

export default CustomersView;
