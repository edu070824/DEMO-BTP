import { useEffect, useMemo, useState } from "react";
import { createOrder, getCustomers, getProducts } from "../services/api";
import { getAvailableStock } from "../utils/products";
import { TechStoreContext } from "./techStoreContext";

export function TechStoreProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [customers, setCustomers] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [customersError, setCustomersError] = useState("");

  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [seller, setSeller] = useState("VENDEDOR01");
  const [observation, setObservation] = useState("PEDIDO CREADO DESDE WEB");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderResponse, setOrderResponse] = useState(null);

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
      currentTheme === "dark" ? "light" : "dark",
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

  const value = {
    activeCustomers,
    activeProducts,
    addToCart,
    canCreateOrder,
    cart,
    cartCount,
    cartTotal,
    customersError,
    handleCreateOrder,
    isCartOpen,
    isCreatingOrder,
    isLoadingCustomers,
    isLoadingProducts,
    observation,
    orderCurrency,
    orderResponse,
    productsError,
    removeFromCart,
    selectedCustomer,
    selectedCustomerId,
    seller,
    setIsCartOpen,
    setObservation,
    setSelectedCustomerId,
    setSeller,
    theme,
    toggleTheme,
    updateCartQuantity,
  };

  return (
    <TechStoreContext.Provider value={value}>
      {children}
    </TechStoreContext.Provider>
  );
}
