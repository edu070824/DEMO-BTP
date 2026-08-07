const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();
const { sendAlert } = require("./alertClient");
const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD || 5);

const app = express();

const PORT = Number(process.env.PORT || 3000);
const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || "http://localhost:5173";

const requiredVariables = [
  "BTP_TOKEN_URL",
  "BTP_CLIENT_ID",
  "BTP_CLIENT_SECRET",
  "IFLOW_PRODUCTS_URL",
  "IFLOW_CUSTOMERS_URL",
  "IFLOW_ORDERS_URL",
];

const missingVariables = requiredVariables.filter(
  (variable) => !process.env[variable],
);

if (missingVariables.length > 0) {
  throw new Error(
    `Faltan variables obligatorias en .env: ${missingVariables.join(", ")}`,
  );
}

app.disable("x-powered-by");

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Accept",
      "Authorization",
      "X-CSRF-Token",
    ],
  }),
);

app.use(express.json({ limit: "1mb" }));

let tokenCache = {
  accessToken: null,
  expiresAt: 0,
};

/**
 * Obtiene un token OAuth 2.0 mediante Client Credentials.
 * Conserva temporalmente el token hasta poco antes de su vencimiento.
 */
async function getAccessToken() {
  const now = Date.now();

  if (
    tokenCache.accessToken &&
    tokenCache.expiresAt > now + 60_000
  ) {
    return tokenCache.accessToken;
  }

  const tokenBody = new URLSearchParams({
    grant_type: "client_credentials",
  });

  const response = await axios.post(
    process.env.BTP_TOKEN_URL,
    tokenBody.toString(),
    {
      auth: {
        username: process.env.BTP_CLIENT_ID,
        password: process.env.BTP_CLIENT_SECRET,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 15_000,
    },
  );

  const accessToken = response.data.access_token;
  const expiresInSeconds = Number(response.data.expires_in || 3600);

  if (!accessToken) {
    throw new Error("BTP no devolvió un access_token.");
  }

  tokenCache = {
    accessToken,
    expiresAt: now + expiresInSeconds * 1000,
  };

  return accessToken;
}

/**
 * Convierte los encabezados Set-Cookie recibidos desde Integration Suite
 * en un único encabezado Cookie para la siguiente solicitud.
 */
function buildCookieHeader(setCookieHeaders) {
  if (!setCookieHeaders) {
    return "";
  }

  const cookies = Array.isArray(setCookieHeaders)
    ? setCookieHeaders
    : [setCookieHeaders];

  return cookies
    .map((cookie) => cookie.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

/**
 * Valida la estructura mínima del pedido antes de enviarlo a SAP.
 */
function validateOrderPayload(payload) {
  const errors = [];

  const header = payload?.IS_CABECERA;
  const positions = payload?.IT_POSICIONES?.item;

  if (!header) {
    errors.push("Falta el objeto IS_CABECERA.");
  } else {
    if (!String(header.ID_CLIENTE || "").trim()) {
      errors.push("IS_CABECERA.ID_CLIENTE es obligatorio.");
    }

    if (!String(header.VENDEDOR || "").trim()) {
      errors.push("IS_CABECERA.VENDEDOR es obligatorio.");
    }

    if (!String(header.MONEDA || "").trim()) {
      errors.push("IS_CABECERA.MONEDA es obligatorio.");
    }
  }

  if (!Array.isArray(positions) || positions.length === 0) {
    errors.push(
      "IT_POSICIONES.item debe contener al menos una posición.",
    );
  } else {
    positions.forEach((position, index) => {
      if (!String(position?.ID_PRODUCTO || "").trim()) {
        errors.push(
          `IT_POSICIONES.item[${index}].ID_PRODUCTO es obligatorio.`,
        );
      }

      const quantity = Number(position?.CANTIDAD);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        errors.push(
          `IT_POSICIONES.item[${index}].CANTIDAD debe ser un entero mayor que cero.`,
        );
      }
    });
  }

  return errors;
}


/**
 * Consulta los productos y, si alguno tiene stock disponible
 * (stock - reservedStock) por debajo del umbral, envía una alerta a ANS.
 * No debe afectar el flujo principal: cualquier error solo se registra.
 */
async function checkLowStock() {
  try {
    const accessToken = await getAccessToken();

    const productsResponse = await axios.get(process.env.IFLOW_PRODUCTS_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      timeout: 30_000,
    });

    const products = Array.isArray(productsResponse.data)
      ? productsResponse.data
      : [];

    for (const product of products) {
      const stock = Number(product.stock ?? 0);
      const reserved = Number(product.reservedStock ?? 0);
      const disponible = stock - reserved;

      if (disponible <= LOW_STOCK_THRESHOLD) {
        await sendAlert({
          eventType: "TechStoreLowStock",
          resource: {
            resourceName: product.id || product.name || "producto-desconocido",
            resourceType: "product",
          },
          severity: disponible <= 0 ? "ERROR" : "WARNING",
          category: "ALERT",
          subject: `Stock bajo: ${product.name || product.id}`,
          body:
            `El producto ${product.name || product.id} (${product.id}) ` +
            `tiene ${disponible} unidades disponibles ` +
            `(stock ${stock} - reservado ${reserved}). ` +
            `Umbral configurado: ${LOW_STOCK_THRESHOLD}.`,
        });

        console.log(
          `[ANS] Alerta enviada por stock bajo: ${product.id} (disponible ${disponible})`
        );
      }
    }
  } catch (error) {
    console.error("[ANS] Error verificando stock bajo:", error.message);
  }
}

/**
 * Ruta básica para comprobar que el backend está funcionando.
 */
app.get("/api/health", (request, response) => {
  response.json({
    status: "ok",
    service: "techstore-api",
  });
});

/**
 * Obtiene los productos reales mediante Integration Suite.
 */
app.get("/api/products", async (request, response) => {
  try {
    const accessToken = await getAccessToken();

    const productsResponse = await axios.get(
      process.env.IFLOW_PRODUCTS_URL,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        timeout: 30_000,
      },
    );

    response.status(200).json(productsResponse.data);
  } catch (error) {
    const upstreamStatus = error.response?.status;
    const upstreamData = error.response?.data;

    console.error("Error consultando productos:", {
      message: error.message,
      upstreamStatus,
      upstreamData,
    });

    response.status(502).json({
      error:
        "No fue posible obtener los productos desde Integration Suite.",
      upstreamStatus: upstreamStatus || null,
    });
  }
});

/**
 * Obtiene los clientes reales mediante Integration Suite.
 */
app.get("/api/customers", async (request, response) => {
  try {
    const accessToken = await getAccessToken();

    const customersResponse = await axios.get(
      process.env.IFLOW_CUSTOMERS_URL,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        timeout: 30_000,
      },
    );

    response.status(200).json(customersResponse.data);
  } catch (error) {
    const upstreamStatus = error.response?.status;
    const upstreamData = error.response?.data;

    console.error("Error consultando clientes:", {
      message: error.message,
      upstreamStatus,
      upstreamData,
    });

    response.status(502).json({
      error:
        "No fue posible obtener los clientes desde Integration Suite.",
      upstreamStatus: upstreamStatus || null,
    });
  }
});

/**
 * Crea un pedido real en MiniSAP mediante Integration Suite.
 *
 * El backend realiza internamente:
 * 1. Obtención del token OAuth.
 * 2. Obtención del token CSRF y las cookies.
 * 3. Envío del pedido mediante POST.
 */
app.post("/api/orders", async (request, response) => {
  const validationErrors = validateOrderPayload(request.body);

  if (validationErrors.length > 0) {
    return response.status(400).json({
      error: "El pedido contiene datos inválidos.",
      details: validationErrors,
    });
  }

  try {
    const accessToken = await getAccessToken();

    /*
     * Primera llamada: obtener token CSRF y cookies de sesión.
     */
    const csrfResponse = await axios.get(
      process.env.IFLOW_ORDERS_URL,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "X-CSRF-Token": "Fetch",
        },
        timeout: 30_000,
      },
    );

    const csrfToken = csrfResponse.headers["x-csrf-token"];
    const cookieHeader = buildCookieHeader(
      csrfResponse.headers["set-cookie"],
    );

    if (!csrfToken) {
      throw new Error(
        "Integration Suite no devolvió el token CSRF.",
      );
    }

    if (!cookieHeader) {
      throw new Error(
        "Integration Suite no devolvió las cookies de sesión.",
      );
    }

    /*
     * Segunda llamada: enviar el pedido usando el token y las cookies
     * de la misma sesión.
     */
    const orderResponse = await axios.post(
      process.env.IFLOW_ORDERS_URL,
      request.body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
          Cookie: cookieHeader,
        },
        timeout: 30_000,
      },
    );

    response.status(200).json(orderResponse.data);

    // Tras crear el pedido, el reservedStock subió → revisar umbral.
    // No usamos await: no debe retrasar la respuesta al cliente.
    checkLowStock();
  } catch (error) {
    const upstreamStatus = error.response?.status;
    const upstreamData = error.response?.data;

    console.error("Error creando pedido:", {
      message: error.message,
      upstreamStatus,
      upstreamData,
    });

    response.status(502).json({
      error:
        "No fue posible crear el pedido mediante Integration Suite.",
      upstreamStatus: upstreamStatus || null,
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `TechStore API ejecutándose en http://localhost:${PORT}`,
  );
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Productos: http://localhost:${PORT}/api/products`);
  console.log(`Clientes: http://localhost:${PORT}/api/customers`);
  console.log(`Pedidos: http://localhost:${PORT}/api/orders`);
});