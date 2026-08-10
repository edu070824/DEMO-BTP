import { useNavigate } from "react-router-dom";
import TechParticles from "../components/TechParticles";
import { useTechStore } from "../hooks/useTechStore";

function HomeView() {
  const navigate = useNavigate();
  const { theme } = useTechStore();

  return (
    <>
      <section className="hero" id="inicio">
        <TechParticles theme={theme} />

        <div className="hero-content">
          <span className="hero-label">
            TECHSTORE <b>·</b> SAP BTP
          </span>

          <h2>
            <span>Encuentra la</span>
            <span>tecnología</span>
            <span>
              que <em>tu negocio</em>
            </span>
            <span>
              <em>necesita</em>
            </span>
          </h2>

          <p>
            Consulta productos, selecciona clientes y genera pedidos conectados
            en tiempo real con SAP.
          </p>

          <button
            className="primary-button"
            type="button"
            onClick={() => navigate("/productos")}
          >
            Ver productos
          </button>
        </div>

        <div className="hero-card">
          <span className="hero-card-icon" aria-hidden="true">💻</span>
          <h3>Catálogo tecnológico</h3>
          <p>
            Productos disponibles directamente desde SAP mediante Integration
            Suite.
          </p>

          <div className="hero-card-badges" aria-label="Características">
            <span>Tiempo real</span>
            <span>Stock vivo</span>
            <span>MiniSAP</span>
          </div>
        </div>
      </section>

      <section className="features" aria-label="Módulos de TechStore">
        <article className="feature-card">
          <span>📦</span>
          <h3>Productos</h3>
          <p>Consulta precios, moneda y stock disponible.</p>
        </article>

        <article className="feature-card">
          <span>👥</span>
          <h3>Clientes</h3>
          <p>Selecciona clientes registrados en TechStore.</p>
        </article>

        <article className="feature-card">
          <span>🛒</span>
          <h3>Pedidos</h3>
          <p>Genera pedidos y recibe el identificador creado en SAP.</p>
        </article>
      </section>
    </>
  );
}

export default HomeView;
