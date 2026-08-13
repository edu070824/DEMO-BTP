import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createOrder,
  getCustomers,
  getProducts,
} from "../services/api";

import { getAvailableStock } from "../utils/products";
import { useAuth } from "../hooks/useAuth";
import { TechStoreContext } from "./techStoreContext";


export function TechStoreProvider({ children }) {
  const { isAuthenticated } = useAuth();
  /* =========================================================
     PRODUCTOS
     ========================================================= */

  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");


  /* =========================================================
     CLIENTES
     ========================================================= */

  const [customers, setCustomers] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [customersError, setCustomersError] = useState("");


  /* =========================================================
     CARRITO / PEDIDO
     ========================================================= */

  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [seller, setSeller] = useState("VENDEDOR01");

  const [observation, setObservation] = useState(
    "PEDIDO CREADO DESDE WEB",
  );

  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderResponse, setOrderResponse] = useState(null);


  /* =========================================================
     NOTIFICACIONES DEL FLUJO DE COMPRA
     ========================================================= */

  const notificationTimerRef = useRef(null);
  const [flowNotification, setFlowNotification] = useState(null);

  const dismissNotification = useCallback(() => {
    if (notificationTimerRef.current) {
      window.clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }

    setFlowNotification(null);
  }, []);

  const showNotification = useCallback((notification) => {
    if (notificationTimerRef.current) {
      window.clearTimeout(notificationTimerRef.current);
    }

    const duration = notification.duration || 5200;
    const nextNotification = {
      ...notification,
      duration,
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    };

    setFlowNotification(nextNotification);
    notificationTimerRef.current = window.setTimeout(() => {
      setFlowNotification(null);
      notificationTimerRef.current = null;
    }, duration);
  }, []);

  useEffect(
    () => () => {
      if (notificationTimerRef.current) {
        window.clearTimeout(notificationTimerRef.current);
      }
    },
    [],
  );


  /* =========================================================
     TEMA
     ========================================================= */

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
    document.documentElement.setAttribute(
      "data-theme",
      theme,
    );

    localStorage.setItem(
      "techstore-theme",
      theme,
    );
  }, [theme]);


  /* =========================================================
     REFRESCAR PRODUCTOS
     ========================================================= */

  const refreshProducts = useCallback(async () => {
    try {
      setIsLoadingProducts(true);
      setProductsError("");

      const realProducts = await getProducts();

      setProducts(realProducts);

      return realProducts;
    } catch (error) {
      console.error(
        "Error cargando productos:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "No fue posible obtener los productos.";

      setProductsError(message);

      throw error;
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);


  /* =========================================================
     REFRESCAR CLIENTES
     ========================================================= */

  const refreshCustomers = useCallback(async () => {
    try {
      setIsLoadingCustomers(true);
      setCustomersError("");

      const realCustomers = await getCustomers();

      setCustomers(realCustomers);

      return realCustomers;
    } catch (error) {
      console.error(
        "Error cargando clientes:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "No fue posible obtener los clientes.";

      setCustomersError(message);

      throw error;
    } finally {
      setIsLoadingCustomers(false);
    }
  }, []);


  /* =========================================================
     CARGA INICIAL
     ========================================================= */

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const loadTimer = window.setTimeout(() => {
      refreshProducts().catch(() => {
        // El error ya queda registrado en productsError.
      });
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [isAuthenticated, refreshProducts]);


  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const loadTimer = window.setTimeout(() => {
      refreshCustomers().catch(() => {
        // El error ya queda registrado en customersError.
      });
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [isAuthenticated, refreshCustomers]);


  /* =========================================================
     PRODUCTOS / CLIENTES ACTIVOS
     ========================================================= */

  const activeProducts = useMemo(
    () =>
      products.filter(
        (product) => product.active,
      ),
    [products],
  );


  const activeCustomers = useMemo(
    () =>
      customers.filter(
        (customer) => customer.active,
      ),
    [customers],
  );


  /* =========================================================
     CÁLCULOS DEL CARRITO
     ========================================================= */

  const cartCount = cart.reduce(
    (total, product) =>
      total + product.quantity,
    0,
  );


  const cartTotal = cart.reduce(
    (total, product) =>
      total + product.price * product.quantity,
    0,
  );


  const selectedCustomer = customers.find(
    (customer) =>
      customer.id === selectedCustomerId,
  );


  const orderCurrency =
    cart[0]?.currency ?? "PEN";


  const orderPositions = cart.map(
    (item) => ({
      ID_PRODUCTO: item.id,
      CANTIDAD: item.quantity,
    }),
  );


  const canCreateOrder = Boolean(
    selectedCustomer &&
      cart.length > 0 &&
      seller.trim(),
  );


  /* =========================================================
     TEMA
     ========================================================= */

  function toggleTheme() {
    setTheme((currentTheme) =>
      currentTheme === "dark"
        ? "light"
        : "dark",
    );
  }


  /* =========================================================
     CARRITO
     ========================================================= */

  function addToCart(product) {
    const availableStock =
      getAvailableStock(product);
    const existingProduct = cart.find(
      (item) => item.id === product.id,
    );

    if (availableStock <= 0 || existingProduct?.quantity >= availableStock) {
      showNotification({
        eyebrow: "STOCK ALCANZADO",
        message: `Ya agregaste todas las unidades disponibles de ${product.name}.`,
        title: "No quedan más unidades",
        type: "error",
      });
      return false;
    }

    const nextQuantity = existingProduct
      ? existingProduct.quantity + 1
      : 1;

    setCart((currentCart) =>
      existingProduct
        ? currentCart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...currentCart, { ...product, quantity: 1 }],
    );

    showNotification({
      action: {
        label: "Elegir cliente",
        to: "/clientes",
      },
      eyebrow: "PRODUCTO AGREGADO",
      message:
        nextQuantity > 1
          ? `Ahora tienes ${nextQuantity} unidades de ${product.name} en el carrito.`
          : `${product.name} ya forma parte de tu pedido.`,
      meta: "Paso 1 completado · Continúa seleccionando un cliente",
      title: "¡Agregado correctamente!",
      type: "success",
    });

    return true;
  }


  function selectCustomer(customerId) {
    const customer = customers.find(
      (currentCustomer) => currentCustomer.id === customerId,
    );

    setSelectedCustomerId(customerId);

    if (customer) {
      showNotification({
        action: {
          label: "Revisar pedido",
          to: "/pedidos",
        },
        eyebrow: "CLIENTE SELECCIONADO",
        message: `${customer.name} recibirá los productos del pedido.`,
        meta: "Paso 2 completado · Tu pedido está listo para revisar",
        title: "Cliente confirmado",
        type: "success",
      });
    }
  }


  const requestFlowNavigation = useCallback((destination) => {
    if (destination === "/clientes" && cart.length === 0) {
      showNotification({
        action: {
          label: "Ver productos",
          to: "/productos",
        },
        eyebrow: "PASO 1 PENDIENTE",
        message:
          "Antes de elegir un cliente debes agregar como mínimo un producto al carrito.",
        meta: "Flujo de compra · Producto → Cliente → Pedido",
        title: "Primero selecciona un producto",
        type: "guidance",
      });
      return false;
    }

    if (destination === "/pedidos" && cart.length === 0) {
      showNotification({
        action: {
          label: "Seleccionar producto",
          to: "/productos",
        },
        eyebrow: "PEDIDO INCOMPLETO",
        message: selectedCustomer
          ? "El cliente ya está elegido. Agrega como mínimo un producto para acceder a Pedidos."
          : "Para acceder a Pedidos debes agregar un producto y después seleccionar el cliente.",
        meta: selectedCustomer
          ? "Falta el paso 1 del flujo de compra"
          : "Faltan los pasos 1 y 2 del flujo de compra",
        title: selectedCustomer
          ? "Selecciona un producto"
          : "Completa primero tu compra",
        type: "guidance",
      });
      return false;
    }

    if (destination === "/pedidos" && !selectedCustomer) {
      showNotification({
        action: {
          label: "Elegir cliente",
          to: "/clientes",
        },
        eyebrow: "PASO 2 PENDIENTE",
        message:
          "Ya tienes productos en el carrito. Ahora selecciona el cliente que recibirá el pedido.",
        meta: "Solo falta elegir un cliente para continuar",
        title: "Selecciona un cliente",
        type: "guidance",
      });
      return false;
    }

    return true;
  }, [cart.length, selectedCustomer, showNotification]);


  function updateCartQuantity(
    productId,
    nextQuantity,
  ) {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.id !== productId) {
            return item;
          }

          const maximumQuantity =
            getAvailableStock(item);

          const validQuantity =
            Math.min(
              Math.max(nextQuantity, 0),
              maximumQuantity,
            );

          return {
            ...item,
            quantity: validQuantity,
          };
        })
        .filter(
          (item) => item.quantity > 0,
        ),
    );
  }


  function removeFromCart(productId) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          item.id !== productId,
      ),
    );
  }


  function resetWorkspaceSession() {
    dismissNotification();
    setCart([]);
    setSelectedCustomerId("");
    setIsCartOpen(false);
    setSeller("VENDEDOR01");
    setObservation("PEDIDO CREADO DESDE WEB");
    setOrderResponse(null);
  }


  /* =========================================================
     CREAR PEDIDO
     ========================================================= */

  async function handleCreateOrder(event) {
    event.preventDefault();

    if (
      !canCreateOrder ||
      isCreatingOrder
    ) {
      return;
    }

    const orderPayload = {
      IS_CABECERA: {
        ID_CLIENTE:
          selectedCustomer.id,

        VENDEDOR:
          seller.trim(),

        MONEDA:
          orderCurrency,

        OBSERVACION:
          observation.trim(),
      },

      IT_POSICIONES: {
        item: orderPositions,
      },
    };

    console.log(
      "Pedido enviado a SAP:",
      orderPayload,
    );

    setIsCreatingOrder(true);
    setOrderResponse(null);

    try {
      const result =
        await createOrder(
          orderPayload,
        );

      setOrderResponse(result);

      console.log(
        "Respuesta real de SAP:",
        result,
      );
    } catch (error) {
      console.error(
        "Error creando el pedido:",
        error,
      );

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


  /* =========================================================
     CONTEXTO GLOBAL
     ========================================================= */

  const value = {
    activeCustomers,
    activeProducts,

    addToCart,

    canCreateOrder,

    cart,
    cartCount,
    cartTotal,

    customersError,

    dismissNotification,

    flowNotification,

    handleCreateOrder,

    isCartOpen,
    isCreatingOrder,
    isLoadingCustomers,
    isLoadingProducts,

    observation,

    orderCurrency,
    orderResponse,

    productsError,

    /*
     * NUEVAS FUNCIONES:
     * podrán ser utilizadas desde AdminView después
     * de crear productos/clientes en SAP.
     */
    refreshCustomers,
    refreshProducts,

    requestFlowNavigation,

    resetWorkspaceSession,

    removeFromCart,

    selectedCustomer,
    selectedCustomerId,

    selectCustomer,

    seller,

    setIsCartOpen,
    setObservation,
    setSeller,

    theme,
    toggleTheme,

    showNotification,

    updateCartQuantity,
  };


  return (
    <TechStoreContext.Provider value={value}>
      {children}
    </TechStoreContext.Provider>
  );
}
