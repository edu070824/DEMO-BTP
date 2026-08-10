import { motion } from "motion/react";
import { customerCardVariants } from "../../animations/variants";

function CustomerCard({
  customer,
  isSelected,
  prefersReducedMotion,
  selectCustomer,
}) {
  return (
    <motion.article
      className={`customer-card ${isSelected ? "selected" : ""}`}
      variants={customerCardVariants}
      whileHover={
        prefersReducedMotion
          ? undefined
          : { y: -8, transition: { duration: 0.22 } }
      }
      layout={!prefersReducedMotion}
    >
      <div className="customer-card-accent" aria-hidden="true" />

      <div className="customer-card-top">
        <div className="customer-avatar-shell">
          <div className="customer-avatar" aria-hidden="true">
            {customer.name.charAt(0)}
          </div>

          <span className="customer-avatar-status" aria-hidden="true" />
        </div>

        <div className="customer-identity">
          <div className="customer-identity-meta">
            <span className="customer-code">{customer.id}</span>
            <span className="customer-active-badge">Activo</span>
          </div>

          <h3>{customer.name}</h3>
        </div>
      </div>

      <div className="customer-details">
        <div className="customer-detail-item">
          <span className="customer-detail-icon" aria-hidden="true">#</span>
          <div>
            <span>{customer.documentType}</span>
            <strong>{customer.documentNumber}</strong>
          </div>
        </div>

        <div className="customer-detail-item">
          <span className="customer-detail-icon" aria-hidden="true">☎</span>
          <div>
            <span>Teléfono</span>
            <strong>{customer.phone}</strong>
          </div>
        </div>

        <div className="customer-detail-item customer-detail-wide">
          <span className="customer-detail-icon" aria-hidden="true">@</span>
          <div>
            <span>Correo</span>
            <strong>{customer.email}</strong>
          </div>
        </div>

        <div className="customer-detail-item customer-detail-wide">
          <span className="customer-detail-icon" aria-hidden="true">⌖</span>
          <div>
            <span>Dirección</span>
            <strong>{customer.address}</strong>
          </div>
        </div>
      </div>

      <motion.button
        className="select-customer-button"
        type="button"
        onClick={() => selectCustomer(customer.id)}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.975 }}
        aria-pressed={isSelected}
      >
        <span>
          {isSelected ? "Cliente seleccionado" : "Seleccionar cliente"}
        </span>

        <span className="select-customer-icon" aria-hidden="true">
          {isSelected ? "✓" : "→"}
        </span>
      </motion.button>
    </motion.article>
  );
}

export default CustomerCard;
