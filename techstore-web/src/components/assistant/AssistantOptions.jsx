import { motion } from "motion/react";
import { productIcons } from "../../utils/products";

function AssistantOptions({ actions, onSelect }) {
  if (actions.length === 0) {
    return null;
  }

  const hasCards = actions.some((action) =>
    ["product", "customer"].includes(action.type),
  );

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={`assistant-options ${hasCards ? "has-cards" : ""}`}
      initial={{ opacity: 0, y: 8 }}
      transition={{ delay: 0.08, duration: 0.25 }}
    >
      {actions.map((action) => {
        const isCard = ["product", "customer"].includes(action.type);

        return (
          <button
            className={`assistant-option is-${action.type}`}
            key={`${action.type}-${action.value}`}
            onClick={() => onSelect(action.value, action.label)}
            type="button"
          >
            {isCard && (
              <span className="assistant-option-icon" aria-hidden="true">
                {action.type === "product"
                  ? productIcons[action.icon] ?? "📦"
                  : action.label.charAt(0)}
              </span>
            )}

            <span className="assistant-option-copy">
              {action.meta && <small>{action.meta}</small>}
              <strong>{action.label}</strong>
              {action.detail && <span>{action.detail}</span>}
            </span>

            {isCard && <span className="assistant-option-arrow">›</span>}
          </button>
        );
      })}
    </motion.div>
  );
}

export default AssistantOptions;
