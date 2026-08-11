import { motion } from "motion/react";

function AssistantMessage({ message }) {
  const isAssistant = message.role === "assistant";

  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className={`assistant-message is-${message.role} ${
        message.status ? `is-${message.status}` : ""
      }`}
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.24 }}
    >
      {isAssistant && (
        <span className="assistant-message-avatar" aria-hidden="true">
          AI
        </span>
      )}

      <div className="assistant-message-content">
        <p>{message.text}</p>
        <time>{message.time}</time>
      </div>

      {!isAssistant && (
        <span className="assistant-message-avatar is-user" aria-hidden="true">
          T
        </span>
      )}
    </motion.article>
  );
}

export default AssistantMessage;
