import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TechParticles from "../components/TechParticles";
import { demoAccounts } from "../data/demoAccounts";
import { useAuth } from "../hooks/useAuth";
import { useTechStore } from "../hooks/useTechStore";
import "../styles/login.css";

const benefits = [
  {
    icon: "↗",
    text: "Pedidos conectados con SAP",
  },
  {
    icon: "◎",
    text: "Stock y clientes en tiempo real",
  },
  {
    icon: "✦",
    text: "Asistente inteligente integrado",
  },
];

function LoginView() {
  const location = useLocation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTechStore();
  const [credentials, setCredentials] = useState({
    identifier: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setCredentials((currentCredentials) => ({
      ...currentCredentials,
      [name]: value,
    }));
    setError("");
  }

  function fillDemoAccount(account) {
    setCredentials({
      identifier: account.email,
      password: account.password,
    });
    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const result = login(
      credentials.identifier,
      credentials.password,
      rememberSession,
    );

    if (!result.ok) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    const requestedPath = location.state?.from;
    const destination =
      result.user.role === "admin"
        ? requestedPath && requestedPath !== "/login"
          ? requestedPath
          : "/admin"
        : requestedPath && requestedPath !== "/admin"
          ? requestedPath
          : "/";

    navigate(destination, { replace: true });
  }

  return (
    <main className="login-page">
      <div className="login-background" aria-hidden="true">
        <TechParticles theme={theme} />
        <span className="login-orb login-orb-one" />
        <span className="login-orb login-orb-two" />
        <span className="login-grid" />
      </div>

      <button
        aria-label={
          theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
        }
        className="login-theme-toggle"
        onClick={toggleTheme}
        title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
        type="button"
      >
        <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
      </button>

      <section className="login-shell">
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className="login-brand-panel"
          initial={prefersReducedMotion ? false : { opacity: 0, x: -22 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="login-brand">
            <span>T</span>
            <div>
              <strong>TechStore</strong>
              <small>Tecnología para todos</small>
            </div>
          </div>

          <div className="login-brand-copy">
            <span>TECHSTORE · SAP BTP</span>
            <h1>
              Tu operación tecnológica, <em>en un solo lugar.</em>
            </h1>
            <p>
              Accede al catálogo, prepara pedidos y administra la información
              conectada con SAP mediante una experiencia segura y ordenada.
            </p>
          </div>

          <div className="login-benefits">
            {benefits.map((benefit) => (
              <div key={benefit.text}>
                <span aria-hidden="true">{benefit.icon}</span>
                <strong>{benefit.text}</strong>
              </div>
            ))}
          </div>

          <div className="login-integration">
            <span><i /> SISTEMA EN LÍNEA</span>
            <div>
              <strong>TechStore</strong>
              <b>→</b>
              <strong>Integration Suite</strong>
              <b>→</b>
              <strong>MiniSAP</strong>
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className="login-form-panel"
          initial={prefersReducedMotion ? false : { opacity: 0, x: 22 }}
          transition={{
            delay: 0.08,
            duration: 0.65,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div className="login-form-heading">
            <span>ACCESO SEGURO</span>
            <h2>Bienvenido de nuevo</h2>
            <p>Ingresa tus credenciales para continuar a TechStore.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="login-identifier">Correo o usuario</label>
            <div className="login-input-shell">
              <span aria-hidden="true">@</span>
              <input
                autoComplete="username"
                id="login-identifier"
                name="identifier"
                onChange={handleChange}
                placeholder="usuario@techstore.pe"
                required
                type="text"
                value={credentials.identifier}
              />
            </div>

            <div className="login-label-row">
              <label htmlFor="login-password">Contraseña</label>
              <small>Acceso simulado</small>
            </div>
            <div className="login-input-shell">
              <span aria-hidden="true">◆</span>
              <input
                autoComplete="current-password"
                id="login-password"
                name="password"
                onChange={handleChange}
                placeholder="Ingresa tu contraseña"
                required
                type={showPassword ? "text" : "password"}
                value={credentials.password}
              />
              <button
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPassword((currentValue) => !currentValue)}
                type="button"
              >
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>

            <label className="login-remember">
              <input
                checked={rememberSession}
                onChange={(event) => setRememberSession(event.target.checked)}
                type="checkbox"
              />
              <span aria-hidden="true" />
              Mantener mi sesión iniciada
            </label>

            {error && (
              <div className="login-error" role="alert">
                <span aria-hidden="true">!</span>
                {error}
              </div>
            )}

            <button
              className="login-submit"
              disabled={isSubmitting}
              type="submit"
            >
              <span>{isSubmitting ? "Validando acceso..." : "Iniciar sesión"}</span>
              <b aria-hidden="true">→</b>
            </button>
          </form>

          <div className="login-demo-section">
            <div className="login-demo-divider">
              <span>ACCESOS DE DEMOSTRACIÓN</span>
            </div>

            <div className="login-demo-grid">
              {demoAccounts.map((account) => (
                <button
                  className={`login-demo-card is-${account.role}`}
                  key={account.id}
                  onClick={() => fillDemoAccount(account)}
                  type="button"
                >
                  <span>{account.role === "admin" ? "A" : "U"}</span>
                  <div>
                    <strong>
                      {account.role === "admin" ? "Administrador" : "Usuario"}
                    </strong>
                    <small>{account.email}</small>
                  </div>
                  <b>Usar</b>
                </button>
              ))}
            </div>

            <p>
              Selecciona una cuenta demo y luego pulsa “Iniciar sesión”.
            </p>
          </div>
        </motion.div>
      </section>

      <footer className="login-footer">
        <span>© 2026 TechStore</span>
        <span>Conectado de forma segura con SAP BTP</span>
      </footer>
    </main>
  );
}

export default LoginView;
