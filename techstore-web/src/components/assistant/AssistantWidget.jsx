import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useTechStore } from "../../hooks/useTechStore";
import useOrderAssistant from "../../hooks/useOrderAssistant";
import "../../styles/assistant.css";
import AssistantMessage from "./AssistantMessage";
import AssistantOptions from "./AssistantOptions";
import OrderAssistantSummary from "./OrderAssistantSummary";

const stepProgress = {
  confirm: 6,
  customer: 3,
  observation: 5,
  product: 1,
  quantity: 2,
  seller: 4,
  submitting: 6,
};

function AssistantWidget() {
  const prefersReducedMotion = useReducedMotion();
  const {
    activeCustomers,
    activeProducts,
    refreshProducts,
  } = useTechStore();
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const {
    actions,
    draft,
    isSubmitting,
    messages,
    placeholder,
    restartConversation,
    sendMessage,
    step,
  } = useOrderAssistant({
    customers: activeCustomers,
    products: activeProducts,
    refreshProducts,
  });

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 220);

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "end",
      });
    }
  }, [actions, isOpen, isSubmitting, messages, prefersReducedMotion, step]);

  async function handleSubmit(event) {
    event.preventDefault();

    const nextInput = input.trim();

    if (!nextInput) {
      return;
    }

    setInput("");
    await sendMessage(nextInput);
  }

  async function handleOptionSelect(value, label) {
    await sendMessage(value, label);
  }

  const currentStep = stepProgress[step];
  const showSummary = ["confirm", "submitting"].includes(step);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              animate={{ opacity: 1 }}
              aria-label="Cerrar asistente"
              className="assistant-backdrop"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              type="button"
            />

            <motion.section
              animate={{ opacity: 1, scale: 1, y: 0 }}
              aria-label="Asistente inteligente de pedidos"
              aria-modal="true"
              className="assistant-panel"
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              initial={
                prefersReducedMotion
                  ? false
                  : { opacity: 0, scale: 0.94, y: 22 }
              }
              role="dialog"
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <header className="assistant-header">
                <div className="assistant-identity">
                  <span className="assistant-avatar" aria-hidden="true">
                    <i>✦</i>
                    <b />
                  </span>

                  <div>
                    <span>ASISTENTE TECHSTORE</span>
                    <h2>Pedidos inteligentes</h2>
                    <small><i /> Conectado con SAP</small>
                  </div>
                </div>

                <div className="assistant-header-actions">
                  <button
                    aria-label="Reiniciar conversación"
                    onClick={restartConversation}
                    title="Reiniciar conversación"
                    type="button"
                  >
                    ↻
                  </button>
                  <button
                    aria-label="Minimizar asistente"
                    onClick={() => setIsOpen(false)}
                    title="Minimizar"
                    type="button"
                  >
                    −
                  </button>
                </div>
              </header>

              <div className="assistant-context-bar">
                <span>
                  <i aria-hidden="true">▣</i>
                  {activeProducts.length} productos
                </span>
                <span>
                  <i aria-hidden="true">●</i>
                  {activeCustomers.length} clientes
                </span>
                {currentStep ? (
                  <strong>Paso {currentStep} de 6</strong>
                ) : (
                  <strong>Listo para ayudarte</strong>
                )}
              </div>

              {currentStep && (
                <div className="assistant-progress" aria-hidden="true">
                  <span style={{ width: `${(currentStep / 6) * 100}%` }} />
                </div>
              )}

              <div className="assistant-conversation" aria-live="polite">
                <div className="assistant-day-label">Conversación actual</div>

                {messages.map((message) => (
                  <AssistantMessage key={message.id} message={message} />
                ))}

                {showSummary && <OrderAssistantSummary draft={draft} />}

                {isSubmitting && (
                  <div className="assistant-typing" role="status">
                    <span className="assistant-message-avatar">AI</span>
                    <div>
                      <i />
                      <i />
                      <i />
                    </div>
                    <small>Creando pedido en SAP...</small>
                  </div>
                )}

                <AssistantOptions actions={actions} onSelect={handleOptionSelect} />
                <div ref={messagesEndRef} />
              </div>

              <form className="assistant-composer" onSubmit={handleSubmit}>
                <div className="assistant-input-shell">
                  <span aria-hidden="true">✦</span>
                  <input
                    aria-label="Mensaje para el asistente"
                    autoComplete="off"
                    disabled={isSubmitting}
                    maxLength="240"
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={placeholder}
                    ref={inputRef}
                    type="text"
                    value={input}
                  />
                  <button
                    aria-label="Enviar mensaje"
                    disabled={!input.trim() || isSubmitting}
                    type="submit"
                  >
                    ↑
                  </button>
                </div>

                <p>
                  <span aria-hidden="true">◆</span>
                  El pedido solo se envía después de tu confirmación.
                </p>
              </form>
            </motion.section>
          </>
        )}
      </AnimatePresence>

      <motion.button
        aria-expanded={isOpen}
        aria-label={isOpen ? "Cerrar asistente" : "Abrir asistente de pedidos"}
        className={`assistant-launcher ${isOpen ? "is-open" : ""}`}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
        whileHover={prefersReducedMotion ? undefined : { scale: 1.05, y: -2 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
      >
        <span className="assistant-launcher-glow" aria-hidden="true" />
        <span className="assistant-launcher-icon" aria-hidden="true">
          {isOpen ? "×" : "✦"}
        </span>
        {!isOpen && (
          <span className="assistant-launcher-copy">
            <small>ASISTENTE</small>
            <strong>¿Necesitas ayuda?</strong>
          </span>
        )}
        {!isOpen && <i className="assistant-launcher-status" aria-hidden="true" />}
      </motion.button>
    </>
  );
}

export default AssistantWidget;
