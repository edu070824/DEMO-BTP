import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useTechStore } from "../../hooks/useTechStore";
import "../../styles/flow-feedback.css";

const toastIcons = {
  error: "!",
  guidance: "→",
  success: "✓",
};

function FlowToastCenter() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { dismissNotification, flowNotification } = useTechStore();

  function handleAction() {
    const destination = flowNotification?.action?.to;

    dismissNotification();

    if (destination) {
      navigate(destination);
    }
  }

  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className="flow-toast-region"
    >
      <AnimatePresence mode="wait">
        {flowNotification && (
          <motion.aside
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className={`flow-toast is-${flowNotification.type}`}
            exit={{ opacity: 0, scale: 0.96, x: 28 }}
            initial={
              prefersReducedMotion
                ? false
                : { opacity: 0, scale: 0.94, x: 36 }
            }
            key={flowNotification.id}
            role={flowNotification.type === "error" ? "alert" : "status"}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="flow-toast-glow" aria-hidden="true" />
            <span className="flow-toast-icon" aria-hidden="true">
              <i>{toastIcons[flowNotification.type] || "✓"}</i>
              <b />
            </span>

            <div className="flow-toast-copy">
              <small>{flowNotification.eyebrow}</small>
              <strong>{flowNotification.title}</strong>
              <p>{flowNotification.message}</p>
              {flowNotification.meta && <span>{flowNotification.meta}</span>}
            </div>

            <button
              aria-label="Cerrar notificación"
              className="flow-toast-close"
              onClick={dismissNotification}
              type="button"
            >
              ×
            </button>

            {flowNotification.action && (
              <button
                className="flow-toast-action"
                onClick={handleAction}
                type="button"
              >
                {flowNotification.action.label}
                <span aria-hidden="true">→</span>
              </button>
            )}

            <motion.span
              animate={{ scaleX: 0 }}
              className="flow-toast-timer"
              initial={{ scaleX: 1 }}
              transition={{
                duration: flowNotification.duration / 1000,
                ease: "linear",
              }}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FlowToastCenter;
