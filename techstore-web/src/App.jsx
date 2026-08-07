import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { getCustomers, getProducts, createOrder } from "./services/api";
import { motion, useReducedMotion } from "motion/react";

import { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import TechParticles from "./components/TechParticles";

const productIcons = {
  LAPTOPS: "💻",
  MONITORES: "🖥️",
  ACCESORIOS: "⌨️",
  TECNOLOGICO: "🎧",
  TECNOLÓGICO: "🎧",
  AUDIFONOS: "🎧",
};

const catalogHeadingVariants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.58,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const catalogGridVariants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.08,
      staggerChildren: 0.11,
    },
  },
};

const productCardVariants = {
  hidden: {
    opacity: 0,
    y: 34,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.62,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const customerGridVariants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.12,
    },
  },
};

const customerCardVariants = {
  hidden: {
    opacity: 0,
    y: 38,
    scale: 0.975,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.64,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const orderPanelVariants = {
  hidden: {
    opacity: 0,
    y: 34,
    scale: 0.985,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.62,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

function getAvailableStock(product) {
  return Math.max(product.stock - product.reservedStock, 0);
}

function formatPrice(price, currency) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}

async function initializeParticles(engine) {
  await loadSlim(engine);
}

function App() {

  const prefersReducedMotion = useReducedMotion();

  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [customers, setCustomers] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [customersError, setCustomersError] = useState("");

  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);

  //pedidos
  const [seller, setSeller] = useState("VENDEDOR01");
  const [observation, setObservation] = useState(
  "PEDIDO CREADO DESDE WEB",
);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderResponse, setOrderResponse] = useState(null);

  // Tema claro / oscuro
  const [theme, setTheme] = useState(() => {
  const savedTheme = localStorage.getItem("techstore-theme");

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
});






useEffect(() => {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("techstore-theme", theme);
}, [theme]);

useEffect(() => {
  let componentIsMounted = true;

  async function loadProducts() {
    try {
      setIsLoadingProducts(true);
      setProductsError("");

      const realProducts = await getProducts();

      if (componentIsMounted) {
        setProducts(realProducts);
      }
    } catch (error) {
      console.error("Error cargando productos:", error);

      if (componentIsMounted) {
        setProductsError(
          error instanceof Error
            ? error.message
            : "No fue posible obtener los productos.",
        );
      }
    } finally {
      if (componentIsMounted) {
        setIsLoadingProducts(false);
      }
    }
  }

  loadProducts();

  return () => {
    componentIsMounted = false;
  };
}, []);


useEffect(() => {
  let componentIsMounted = true;

  async function loadCustomers() {
    try {
      setIsLoadingCustomers(true);
      setCustomersError("");

      const realCustomers = await getCustomers();

      if (componentIsMounted) {
        setCustomers(realCustomers);
      }
    } catch (error) {
      console.error("Error cargando clientes:", error);

      if (componentIsMounted) {
        setCustomersError(
          error instanceof Error
            ? error.message
            : "No fue posible obtener los clientes.",
        );
      }
    } finally {
      if (componentIsMounted) {
        setIsLoadingCustomers(false);
      }
    }
  }

  loadCustomers();

  return () => {
    componentIsMounted = false;
  };
}, []);


  const activeProducts = useMemo(
  () => products.filter((product) => product.active),
  [products],
  );

  const activeCustomers = useMemo(
  () => customers.filter((customer) => customer.active),
  [customers],
  );

  const cartCount = cart.reduce(
    (total, product) => total + product.quantity,
    0,
  );

  const cartTotal = cart.reduce(
  (total, product) => total + product.price * product.quantity,
  0,
  );

  const selectedCustomer = customers.find(
  (customer) => customer.id === selectedCustomerId,
  );

const orderCurrency = cart[0]?.currency ?? "PEN";

const orderPositions = cart.map((item) => ({
  ID_PRODUCTO: item.id,
  CANTIDAD: item.quantity,
}));

const canCreateOrder = Boolean(
  selectedCustomer &&
  cart.length > 0 &&
  seller.trim(),
);

function toggleTheme() {
  setTheme((currentTheme) =>
    currentTheme === "dark" ? "light" : "dark"
  );
}

  
  function addToCart(product) {
    const availableStock = getAvailableStock(product);

    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) => item.id === product.id,
      );

      if (existingProduct?.quantity >= availableStock) {
        return currentCart;
      }

      if (existingProduct) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });
  }

  function updateCartQuantity(productId, nextQuantity) {
  setCart((currentCart) =>
    currentCart
      .map((item) => {
        if (item.id !== productId) {
          return item;
        }

        const maximumQuantity = getAvailableStock(item);
        const validQuantity = Math.min(
          Math.max(nextQuantity, 0),
          maximumQuantity,
        );

        return {
          ...item,
          quantity: validQuantity,
        };
      })
      .filter((item) => item.quantity > 0),
  );
}

function removeFromCart(productId) {
  setCart((currentCart) =>
    currentCart.filter((item) => item.id !== productId),
  );
}

async function handleCreateOrder(event) {
  event.preventDefault();

  if (!canCreateOrder || isCreatingOrder) {
    return;
  }

  const orderPayload = {
    IS_CABECERA: {
      ID_CLIENTE: selectedCustomer.id,
      VENDEDOR: seller.trim(),
      MONEDA: orderCurrency,
      OBSERVACION: observation.trim(),
    },
    IT_POSICIONES: {
      item: orderPositions,
    },
  };

  console.log("Pedido enviado a SAP:", orderPayload);

  setIsCreatingOrder(true);
  setOrderResponse(null);

  try {
    const result = await createOrder(orderPayload);

    setOrderResponse(result);

    console.log("Respuesta real de SAP:", result);
  } catch (error) {
    console.error("Error creando el pedido:", error);

    setOrderResponse({
      TYPE: "E",
      NUMBER: "",
      MESSAGE:
        error instanceof Error
          ? error.message
          : "No fue posible crear el pedido.",
      EV_ID_PEDIDO: "",
    });
  } finally {
    setIsCreatingOrder(false);
  }
}

  function scrollToProducts() {
    document
      .getElementById("productos")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <ParticlesProvider init={initializeParticles}>
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-icon">T</span>

            <div>
              <h1>TechStore</h1>
              <p>Tecnología para todos</p>
            </div>
          </div>

          <nav className="navigation" aria-label="Navegación principal">
            <a href="#inicio">Inicio</a>
            <a href="#productos">Productos</a>
            <a href="#clientes">Clientes</a>
            <a href="#pedidos">Pedidos</a>
          </nav>

          <div className="header-actions">
            <button
              className="theme-toggle"
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Cambiar a modo claro"
                  : "Cambiar a modo oscuro"
              }
              title={
                theme === "dark"
                  ? "Cambiar a modo claro"
                  : "Cambiar a modo oscuro"
              }
            >
              <span className="theme-toggle-icon" aria-hidden="true">
                {theme === "dark" ? "☀️" : "🌙"}
              </span>

              <span className="theme-toggle-text">
                {theme === "dark" ? "Claro" : "Oscuro"}
              </span>
            </button>

            <button
              className="cart-button"
              type="button"
              onClick={() => setIsCartOpen(true)}
            >
              Carrito ({cartCount})
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <TechParticles theme={theme} />
          
          <div className="hero-content">
            <span className="hero-label">TECHSTORE <b>·</b> SAP BTP</span>

            <h2>
              <span>Encuentra la</span>
              <span>tecnología</span>
              <span>
                que <em>tu negocio</em>
              </span>
              <span><em>necesita</em></span>
            </h2>

            <p>
              Consulta productos, selecciona clientes y genera pedidos
              conectados en tiempo real con SAP.
            </p>

            <button
              className="primary-button"
              type="button"
              onClick={scrollToProducts}
            >
              Ver productos
            </button>
          </div>

          <div className="hero-card">
            <span className="hero-card-icon" aria-hidden="true">💻</span>
            <h3>Catálogo tecnológico</h3>
            <p>
              Productos disponibles directamente desde SAP mediante
              Integration Suite.
            </p>

            <div className="hero-card-badges" aria-label="Características">
              <span>Tiempo real</span>
              <span>Stock vivo</span>
              <span>MiniSAP</span>
            </div>
          </div>
        </section>

        <section className="features">
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

        <motion.section
          className="catalog-section"
          id="productos"
          initial={prefersReducedMotion ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.16 }}
        >
          <motion.div
            className="section-heading catalog-heading"
            variants={catalogHeadingVariants}
          >
            <span>CATÁLOGO</span>
            <h2>Productos disponibles</h2>
            <p>
              Productos obtenidos en tiempo real desde SAP mediante Integration Suite.
            </p>
          </motion.div>

          <motion.div
            className="product-grid"
            variants={catalogGridVariants}
          >
            {activeProducts.map((product) => {
              const availableStock = getAvailableStock(product);

              return (
                <motion.article
                  className="product-card"
                  key={product.id}
                  variants={productCardVariants}
                  whileHover={
                    prefersReducedMotion
                      ? undefined
                      : { y: -9, transition: { duration: 0.22 } }
                  }
                >
                  <div className="product-image">
                    <div className="product-image-glow" aria-hidden="true" />

                    <span aria-hidden="true">
                      {productIcons[product.category] ?? "📦"}
                    </span>

                    <small>{product.id}</small>
                  </div>

                  <div className="product-card-body">
                    <span className="product-category">
                      {product.category}
                    </span>

                    <h3>{product.name}</h3>

                    <p className="product-description">
                      {product.description}
                    </p>

                    <div className="product-meta">
                      <div>
                        <span className="product-price">
                          {formatPrice(product.price, product.currency)}
                        </span>

                        <span className="product-stock">
                          {availableStock} disponibles
                        </span>
                      </div>

                      <motion.button
                        className="add-cart-button"
                        type="button"
                        disabled={availableStock === 0}
                        onClick={() => addToCart(product)}
                        whileTap={
                          availableStock > 0 && !prefersReducedMotion
                            ? { scale: 0.96 }
                            : undefined
                        }
                        aria-label={
                          availableStock > 0
                            ? `Agregar ${product.name} al carrito`
                            : `${product.name} sin stock`
                        }
                      >
                        <span>
                          {availableStock > 0 ? "Agregar" : "Sin stock"}
                        </span>

                        {availableStock > 0 && (
                          <span className="add-cart-icon" aria-hidden="true">+</span>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </motion.section>

<motion.section
  className="customers-section"
  id="clientes"
  initial={prefersReducedMotion ? false : "hidden"}
  whileInView="visible"
  viewport={{ once: true, amount: 0.12 }}
>
  <motion.div
    className="section-heading customer-heading"
    variants={catalogHeadingVariants}
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

  <motion.div
    className="customer-grid"
    variants={customerGridVariants}
  >
    {activeCustomers
      .filter((customer) => customer.active)
      .map((customer) => {
        const isSelected = customer.id === selectedCustomerId;

        return (
          <motion.article
            className={`customer-card ${isSelected ? "selected" : ""}`}
            key={customer.id}
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
              onClick={() => setSelectedCustomerId(customer.id)}
              whileTap={
                prefersReducedMotion ? undefined : { scale: 0.975 }
              }
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
      })}
  </motion.div>

  {selectedCustomer && (
    <motion.div
      className="selected-customer-summary"
      key={selectedCustomer.id}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 14, scale: 0.985 }}
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

<motion.section
  className="order-section"
  id="pedidos"
  initial={prefersReducedMotion ? false : "hidden"}
  whileInView="visible"
  viewport={{ once: true, amount: 0.08 }}
>
  <motion.div className="order-heading" variants={catalogHeadingVariants}>
    <span>PEDIDO SAP</span>
    <h2>Confirma la información del pedido</h2>
    <p>
      Revisa los datos finales y envía una solicitud clara, completa y segura
      hacia SAP.
    </p>

    <div className="order-progress" aria-label="Progreso del pedido">
      <div
        className={`order-progress-step ${
          selectedCustomer ? "is-complete" : "is-pending"
        }`}
      >
        <span>01</span>
        <div>
          <strong>Cliente</strong>
          <small>{selectedCustomer ? "Seleccionado" : "Pendiente"}</small>
        </div>
      </div>

      <span
        className={`order-progress-line ${
          selectedCustomer ? "is-complete" : ""
        }`}
        aria-hidden="true"
      />

      <div
        className={`order-progress-step ${
          cart.length > 0 ? "is-complete" : "is-pending"
        }`}
      >
        <span>02</span>
        <div>
          <strong>Productos</strong>
          <small>
            {cart.length > 0
              ? `${cart.length} ${cart.length === 1 ? "agregado" : "agregados"}`
              : "Pendiente"}
          </small>
        </div>
      </div>

      <span
        className={`order-progress-line ${
          cart.length > 0 ? "is-complete" : ""
        }`}
        aria-hidden="true"
      />

      <div
        className={`order-progress-step ${
          canCreateOrder ? "is-ready" : "is-pending"
        }`}
      >
        <span>03</span>
        <div>
          <strong>Envío SAP</strong>
          <small>{canCreateOrder ? "Listo para enviar" : "Por validar"}</small>
        </div>
      </div>
    </div>
  </motion.div>

  <div className="order-layout">
    <motion.form
      className="order-form"
      onSubmit={handleCreateOrder}
      variants={orderPanelVariants}
    >
      <span className="order-card-accent" aria-hidden="true" />

      <div className="order-form-header">
        <div className="order-form-title-row">
          <span className="order-form-icon" aria-hidden="true">✦</span>
          <div>
            <span>DATOS DE CABECERA</span>
            <h3>Información general</h3>
          </div>
        </div>

        <div className="order-status-badge">
          <i aria-hidden="true" />
          Integration Suite
        </div>
      </div>

      <div className="order-fields">
        <div className="form-field form-field-full">
          <div className="field-label-row">
            <label htmlFor="order-customer">Cliente del pedido</label>
            <small>Obligatorio</small>
          </div>

          <div
            className={`input-shell ${
              !selectedCustomer ? "input-shell-warning" : "input-shell-ready"
            }`}
          >
            <span className="field-leading-icon" aria-hidden="true">ID</span>
            <input
              id="order-customer"
              type="text"
              value={
                selectedCustomer
                  ? `${selectedCustomer.id} - ${selectedCustomer.name}`
                  : ""
              }
              placeholder="Selecciona un cliente"
              readOnly
            />
            {selectedCustomer && (
              <span className="field-state-icon" aria-hidden="true">✓</span>
            )}
          </div>

          {!selectedCustomer && (
            <small className="field-warning">
              <span aria-hidden="true">!</span>
              Debes seleccionar un cliente antes de crear el pedido.
            </small>
          )}
        </div>

        <div className="form-field">
          <div className="field-label-row">
            <label htmlFor="order-seller">Vendedor</label>
            <small>Máx. 20 caracteres</small>
          </div>

          <div className="input-shell">
            <span className="field-leading-icon" aria-hidden="true">VE</span>
            <input
              id="order-seller"
              type="text"
              value={seller}
              maxLength={20}
              placeholder="Ejemplo: VENDEDOR01"
              onChange={(event) => setSeller(event.target.value)}
            />
          </div>
        </div>

        <div className="form-field">
          <div className="field-label-row">
            <label htmlFor="order-currency">Moneda</label>
            <small>Automática</small>
          </div>

          <div className="input-shell input-shell-readonly">
            <span className="field-leading-icon" aria-hidden="true">S/</span>
            <input
              id="order-currency"
              type="text"
              value={orderCurrency}
              readOnly
            />
            <span className="field-lock" aria-hidden="true">•</span>
          </div>
        </div>

        <div className="form-field form-field-full">
          <div className="field-label-row">
            <label htmlFor="order-observation">Observación</label>
            <small>Se enviará a SAP</small>
          </div>

          <div className="input-shell textarea-shell">
            <span className="field-leading-icon" aria-hidden="true">TXT</span>
            <textarea
              id="order-observation"
              rows="4"
              value={observation}
              placeholder="Ingresa una observación para el pedido"
              onChange={(event) => setObservation(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={`order-readiness ${canCreateOrder ? "is-ready" : ""}`}>
        <div className="order-readiness-copy">
          <span>VALIDACIÓN DEL PEDIDO</span>
          <strong>
            {canCreateOrder
              ? "Todo está listo para continuar"
              : "Completa los datos pendientes"}
          </strong>
        </div>

        <div className="order-readiness-checks">
          <span className={selectedCustomer ? "is-complete" : ""}>
            {selectedCustomer ? "✓" : "○"} Cliente
          </span>
          <span className={cart.length > 0 ? "is-complete" : ""}>
            {cart.length > 0 ? "✓" : "○"} Productos
          </span>
          <span className={seller.trim() ? "is-complete" : ""}>
            {seller.trim() ? "✓" : "○"} Vendedor
          </span>
        </div>
      </div>

      <div className="order-form-actions">
        <button
          className="secondary-order-button"
          type="button"
          onClick={() => {
            document
              .getElementById("productos")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <span className="button-icon" aria-hidden="true">↗</span>
          Modificar productos
        </button>

        <button
          className="create-order-button"
          type="submit"
          disabled={!canCreateOrder || isCreatingOrder}
        >
          <span>
            {isCreatingOrder ? "Creando pedido..." : "Crear pedido en SAP"}
          </span>
          <span className="button-arrow" aria-hidden="true">
            {isCreatingOrder ? "…" : "→"}
          </span>
        </button>
      </div>

      {!canCreateOrder && (
        <p className="order-validation-message">
          <span aria-hidden="true">!</span>
          Para continuar necesitas seleccionar un cliente, agregar al menos un
          producto e ingresar el vendedor.
        </p>
      )}

      {orderResponse && (
        <motion.div
          className={`order-result ${
            orderResponse.TYPE?.trim().toUpperCase() === "S"
              ? "order-result-success"
              : "order-result-error"
          }`}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38 }}
        >
          <div className="order-result-icon">
            {orderResponse.TYPE?.trim().toUpperCase() === "S" ? "✓" : "!"}
          </div>

          <div>
            <span>
              {orderResponse.TYPE?.trim().toUpperCase() === "S"
                ? "Pedido creado correctamente"
                : "No fue posible crear el pedido"}
            </span>

            {orderResponse.TYPE?.trim().toUpperCase() === "S" &&
              orderResponse.EV_ID_PEDIDO && (
                <h4>{orderResponse.EV_ID_PEDIDO}</h4>
              )}

            <p>{orderResponse.MESSAGE}</p>
          </div>
        </motion.div>
      )}
    </motion.form>

    <motion.aside
      className="final-order-summary"
      variants={orderPanelVariants}
      transition={{ delay: 0.1 }}
    >
      <span className="summary-card-accent" aria-hidden="true" />

      <div className="final-summary-header">
        <div>
          <span>RESUMEN EN VIVO</span>
          <h3>Detalle del pedido</h3>
        </div>
        <small>
          {cart.length} {cart.length === 1 ? "producto" : "productos"}
        </small>
      </div>

      <div
        className={`final-customer ${
          selectedCustomer ? "has-customer" : "is-empty"
        }`}
      >
        <div className="final-customer-avatar" aria-hidden="true">
          {selectedCustomer ? selectedCustomer.name.charAt(0) : "?"}
        </div>
        <div>
          <span>CLIENTE</span>
          {selectedCustomer ? (
            <>
              <strong>{selectedCustomer.name}</strong>
              <small>{selectedCustomer.id}</small>
            </>
          ) : (
            <>
              <strong>Cliente pendiente</strong>
              <p>Selecciona una empresa para continuar</p>
            </>
          )}
        </div>
        <span
          className={`final-customer-state ${
            selectedCustomer ? "is-complete" : ""
          }`}
          aria-hidden="true"
        >
          {selectedCustomer ? "✓" : "!"}
        </span>
      </div>

      <div className="final-items-label">
        <span>PRODUCTOS</span>
        <small>
          {cart.reduce((total, item) => total + item.quantity, 0)} unidades
        </small>
      </div>

      <div className="final-order-items">
        {cart.length === 0 ? (
          <div className="empty-order-items">
            <span aria-hidden="true">＋</span>
            <strong>Aún no hay productos</strong>
            <p>Agrega artículos del catálogo para completar el pedido.</p>
          </div>
        ) : (
          cart.map((item) => (
            <article className="final-order-item" key={item.id}>
              <span className="final-order-item-icon" aria-hidden="true">
                {productIcons[item.category] || "📦"}
              </span>

              <div className="final-order-item-copy">
                <span>{item.id}</span>
                <strong>{item.name}</strong>
                <small>
                  {item.quantity} ×{" "}
                  {formatPrice(item.price, item.currency)}
                </small>
              </div>

              <strong className="final-order-item-price">
                {formatPrice(
                  item.price * item.quantity,
                  item.currency,
                )}
              </strong>
            </article>
          ))
        )}
      </div>

      <div className="final-order-total">
        <div>
          <span>TOTAL DEL PEDIDO</span>
          <small>Impuestos incluidos</small>
        </div>
        <strong>{formatPrice(cartTotal, orderCurrency)}</strong>
      </div>

      <div className="sap-structure-preview">
        <div className="sap-preview-title">
          <span>INTEGRACIÓN ACTIVA</span>
          <small><i aria-hidden="true" /> En línea</small>
        </div>

        <div className="sap-flow" aria-label="Flujo de integración">
          <span>TechStore</span>
          <i aria-hidden="true">→</i>
          <span>Integration Suite</span>
          <i aria-hidden="true">→</i>
          <span>MiniSAP</span>
        </div>
      </div>
    </motion.aside>
  </div>
</motion.section>

      </main>

    {isCartOpen && (
  <div
    className="cart-overlay"
    role="presentation"
    onClick={() => setIsCartOpen(false)}
  >
    <aside
      className="cart-panel"
      aria-label="Carrito de compras"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="cart-panel-header">
        <div>
          <span>TECHSTORE</span>
          <h2>Tu carrito</h2>
        </div>

        <button
          className="close-cart-button"
          type="button"
          aria-label="Cerrar carrito"
          onClick={() => setIsCartOpen(false)}
        >
          ×
        </button>
      </div>

      {cart.length === 0 ? (
        <div className="empty-cart">
          <span>🛒</span>
          <h3>El carrito está vacío</h3>
          <p>Agrega productos desde el catálogo para crear un pedido.</p>

          <button
            type="button"
            onClick={() => {
              setIsCartOpen(false);
              document
                .getElementById("productos")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Ver productos
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((item) => (
              <article className="cart-item" key={item.id}>
                <div className="cart-item-icon">
                  {productIcons[item.category] ?? "📦"}
                </div>

                <div className="cart-item-information">
                  <span>{item.id}</span>
                  <h3>{item.name}</h3>

                  <p>
                    {formatPrice(item.price, item.currency)} por unidad
                  </p>

                  <div className="quantity-control">
                    <button
                      type="button"
                      aria-label={`Disminuir cantidad de ${item.name}`}
                      onClick={() =>
                        updateCartQuantity(
                          item.id,
                          item.quantity - 1,
                        )
                      }
                    >
                      −
                    </button>

                    <strong>{item.quantity}</strong>

                    <button
                      type="button"
                      aria-label={`Aumentar cantidad de ${item.name}`}
                      disabled={
                        item.quantity >= getAvailableStock(item)
                      }
                      onClick={() =>
                        updateCartQuantity(
                          item.id,
                          item.quantity + 1,
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="cart-item-actions">
                  <strong>
                    {formatPrice(
                      item.price * item.quantity,
                      item.currency,
                    )}
                  </strong>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="cart-order-summary">
            <div className="cart-customer-summary">
              <span>Cliente del pedido</span>

              {selectedCustomer ? (
                <>
                  <strong>{selectedCustomer.name}</strong>
                  <small>{selectedCustomer.id}</small>
                </>
              ) : (
                <p>Aún no has seleccionado un cliente.</p>
              )}
            </div>

            <div className="cart-total">
              <span>Total del pedido</span>

              <strong>
                {formatPrice(
                  cartTotal,
                  cart[0]?.currency ?? "PEN",
                )}
              </strong>
            </div>

            <p className="cart-next-step">
              En el siguiente paso enviaremos esta información al servicio
              de creación de pedidos.
            </p>
            <button
  className="continue-order-button"
  type="button"
  disabled={!selectedCustomer || cart.length === 0}
  onClick={() => {
    setIsCartOpen(false);

    document
      .getElementById("pedidos")
      ?.scrollIntoView({ behavior: "smooth" });
  }}
>
  {selectedCustomer
    ? "Continuar con el pedido"
    : "Selecciona un cliente para continuar"}
</button>
          </div>
        </>
      )}
    </aside>
  </div>
)} 

    </div>
    </ParticlesProvider>
  );
}

export default App;
