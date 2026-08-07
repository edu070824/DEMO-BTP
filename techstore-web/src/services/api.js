const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export async function getProducts() {
  const response = await fetch(`${API_BASE_URL}/api/products`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `No se pudieron obtener los productos. HTTP ${response.status}`
    );
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("La respuesta de productos no es un arreglo.");
  }

  return data;
}


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
    throw new Error("La respuesta de clientes no es un arreglo.");
  }

  return data;
}

export async function createOrder(orderPayload) {
  const response = await fetch(`${API_BASE_URL}/api/orders`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderPayload),
  });

  let data = null;

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