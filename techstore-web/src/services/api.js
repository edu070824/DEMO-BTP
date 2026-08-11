const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";


/* =========================================================
   PRODUCTOS
   ========================================================= */

/**
 * Obtiene los productos reales desde el backend.
 */
export async function getProducts() {
  const response = await fetch(`${API_BASE_URL}/api/products`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `No se pudieron obtener los productos. HTTP ${response.status}`,
    );
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error(
      "La respuesta de productos no es un arreglo.",
    );
  }

  return data;
}


/**
 * Crea un producto real en SAP.
 *
 * Flujo:
 * React
 * → techstore-api
 * → Integration Suite
 * → MiniSAP
 */
export async function createProduct(productPayload) {
  const response = await fetch(`${API_BASE_URL}/api/products`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(productPayload),
  });

  let data;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.MESSAGE ||
      data?.message ||
      `No se pudo crear el producto. HTTP ${response.status}`;

    throw new Error(message);
  }

  return data;
}


/* =========================================================
   CLIENTES
   ========================================================= */

/**
 * Obtiene los clientes reales desde el backend.
 */
export async function getCustomers() {
  const response = await fetch(`${API_BASE_URL}/api/customers`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `No se pudieron obtener los clientes. HTTP ${response.status}`,
    );
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error(
      "La respuesta de clientes no es un arreglo.",
    );
  }

  return data;
}


/**
 * Crea un cliente real en SAP.
 *
 * Flujo:
 * React
 * → techstore-api
 * → Integration Suite
 * → MiniSAP
 */
export async function createCustomer(customerPayload) {
  const response = await fetch(`${API_BASE_URL}/api/customers`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(customerPayload),
  });

  let data;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.MESSAGE ||
      data?.message ||
      `No se pudo crear el cliente. HTTP ${response.status}`;

    throw new Error(message);
  }

  return data;
}


/* =========================================================
   PEDIDOS
   ========================================================= */

/**
 * Crea un pedido real en SAP.
 */
export async function createOrder(orderPayload) {
  const response = await fetch(`${API_BASE_URL}/api/orders`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderPayload),
  });

  let data;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      `No se pudo crear el pedido. HTTP ${response.status}`;

    throw new Error(message);
  }

  return data;
}
