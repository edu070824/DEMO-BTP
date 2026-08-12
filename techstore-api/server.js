const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const { sendAlert } = require("./alertClient");
const {
  GeminiAssistantError,
  interpretAssistantMessage,
} = require("./geminiAssistant");
const { buildStockReport } = require("./stockReport");

const LOW_STOCK_THRESHOLD = Number(
  process.env.LOW_STOCK_THRESHOLD || 5
);

const app = express();

const PORT = Number(process.env.PORT || 3000);
const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || "http://localhost:5173";

/*
 * Variables obligatorias
 */
const requiredVariables = [
  "BTP_TOKEN_URL",
  "BTP_CLIENT_ID",
  "BTP_CLIENT_SECRET",
  "IFLOW_PRODUCTS_URL",
  "IFLOW_CUSTOMERS_URL",
  "IFLOW_ORDERS_URL",

  // NUEVAS
  "IFLOW_PRODUCTS_CREATE_URL",
  "IFLOW_CUSTOMERS_CREATE_URL",
];

const missingVariables = requiredVariables.filter(
  (variable) => !process.env[variable],
);

if (missingVariables.length > 0) {
  throw new Error(
    `Faltan variables obligatorias en .env: ${missingVariables.join(", ")}`
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
    exposedHeaders: ["Content-Disposition"],
  }),
);

app.use(express.json({ limit: "1mb" }));


/* =========================================================
   TOKEN OAUTH BTP
   ========================================================= */

let tokenCache = {
  accessToken: null,
  expiresAt: 0,
};

/**
 * Obtiene un token OAuth 2.0 mediante Client Credentials.
 * Mantiene el token en caché hasta poco antes de que expire.
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
  const expiresInSeconds = Number(
    response.data.expires_in || 3600
  );

  if (!accessToken) {
    throw new Error("BTP no devolvió un access_token.");
  }

  tokenCache = {
    accessToken,
    expiresAt: now + expiresInSeconds * 1000,
  };

  return accessToken;
}


/* =========================================================
   FUNCIONES AUXILIARES
   ========================================================= */

/**
 * Convierte los encabezados Set-Cookie recibidos desde
 * Integration Suite en un único encabezado Cookie.
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
 * Indica si una respuesta BAPIRET2 representa un error SAP.
 *
 * E = Error
 * A = Abort
 * X = Exit / error crítico
 *
 * S = Success
 * W = Warning
 * I = Information
 */
function isSapErrorResponse(data) {
  const type = String(data?.TYPE || "")
    .trim()
    .toUpperCase();

  return ["E", "A", "X"].includes(type);
}


/**
 * Obtiene un mensaje entendible de un error recibido desde
 * Integration Suite.
 */
function getUpstreamErrorMessage(
  upstreamData,
  fallbackMessage,
) {
  if (typeof upstreamData === "string") {
    return upstreamData;
  }

  return (
    upstreamData?.error ||
    upstreamData?.MESSAGE ||
    upstreamData?.message ||
    fallbackMessage
  );
}


/* =========================================================
   VALIDACIÓN DE PEDIDOS
   ========================================================= */

function validateOrderPayload(payload) {
  const errors = [];

  const header = payload?.IS_CABECERA;
  const positions = payload?.IT_POSICIONES?.item;

  if (!header) {
    errors.push("Falta el objeto IS_CABECERA.");
  } else {
    if (!String(header.ID_CLIENTE || "").trim()) {
      errors.push(
        "IS_CABECERA.ID_CLIENTE es obligatorio."
      );
    }

    if (!String(header.VENDEDOR || "").trim()) {
      errors.push(
        "IS_CABECERA.VENDEDOR es obligatorio."
      );
    }

    if (!String(header.MONEDA || "").trim()) {
      errors.push(
        "IS_CABECERA.MONEDA es obligatorio."
      );
    }
  }

  if (!Array.isArray(positions) || positions.length === 0) {
    errors.push(
      "IT_POSICIONES.item debe contener al menos una posición."
    );
  } else {
    positions.forEach((position, index) => {
      if (!String(position?.ID_PRODUCTO || "").trim()) {
        errors.push(
          `IT_POSICIONES.item[${index}].ID_PRODUCTO es obligatorio.`
        );
      }

      const quantity = Number(position?.CANTIDAD);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        errors.push(
          `IT_POSICIONES.item[${index}].CANTIDAD debe ser un entero mayor que cero.`
        );
      }
    });
  }

  return errors;
}


/* =========================================================
   ALERT NOTIFICATION
   ========================================================= */

/**
 * Consulta productos y genera alerta si el stock disponible
 * está por debajo del umbral configurado.
 */
async function checkLowStock() {
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

    const products = Array.isArray(productsResponse.data)
      ? productsResponse.data
      : [];

    for (const product of products) {
      const stock = Number(product.stock ?? 0);
      const reserved = Number(
        product.reservedStock ?? 0
      );

      const disponible = stock - reserved;

      if (disponible <= LOW_STOCK_THRESHOLD) {
        await sendAlert({
          eventType: "TechStoreLowStock",

          resource: {
            resourceName:
              product.id ||
              product.name ||
              "producto-desconocido",

            resourceType: "product",
          },

          severity:
            disponible <= 0 ? "ERROR" : "WARNING",

          category: "ALERT",

          subject:
            `Stock bajo: ${product.name || product.id}`,

          body:
            `El producto ${product.name || product.id} (${product.id}) ` +
            `tiene ${disponible} unidades disponibles ` +
            `(stock ${stock} - reservado ${reserved}). ` +
            `Umbral configurado: ${LOW_STOCK_THRESHOLD}.`,
        });

        console.log(
          `[ANS] Alerta enviada por stock bajo: ${product.id} ` +
          `(disponible ${disponible})`
        );
      }
    }
  } catch (error) {
    console.error(
      "[ANS] Error verificando stock bajo:",
      error.message
    );
  }
}


/* =========================================================
   HEALTH
   ========================================================= */

app.get("/api/health", (request, response) => {
  response.json({
    status: "ok",
    service: "techstore-api",
    assistant: String(process.env.GEMINI_API_KEY || "").trim()
      ? "gemini"
      : "guided",
  });
});


/* =========================================================
   ASISTENTE INTELIGENTE - INTERPRETACIÓN CON GEMINI

   Gemini solo interpreta el lenguaje y devuelve una intención.
   Este endpoint nunca crea pedidos ni se comunica con SAP.
   ========================================================= */

const assistantRequestsByIp = new Map();
const ASSISTANT_RATE_LIMIT = 20;
const ASSISTANT_RATE_WINDOW_MS = 60_000;

function isAssistantRateLimited(ipAddress) {
  const now = Date.now();
  const previousRequests = assistantRequestsByIp.get(ipAddress) || [];
  const recentRequests = previousRequests.filter(
    (timestamp) => timestamp > now - ASSISTANT_RATE_WINDOW_MS,
  );

  recentRequests.push(now);
  assistantRequestsByIp.set(ipAddress, recentRequests);

  return recentRequests.length > ASSISTANT_RATE_LIMIT;
}

app.post("/api/assistant/chat", async (request, response) => {
  const message = String(request.body?.message || "").trim();

  if (!message) {
    return response.status(400).json({
      error: "El mensaje es obligatorio.",
      code: "ASSISTANT_MESSAGE_REQUIRED",
    });
  }

  if (message.length > 500) {
    return response.status(400).json({
      error: "El mensaje no puede superar los 500 caracteres.",
      code: "ASSISTANT_MESSAGE_TOO_LONG",
    });
  }

  if (isAssistantRateLimited(request.ip || "unknown")) {
    return response.status(429).json({
      error: "Se alcanzó el límite temporal de mensajes del asistente.",
      code: "ASSISTANT_RATE_LIMITED",
    });
  }

  try {
    const interpretation = await interpretAssistantMessage(request.body);

    return response.status(200).json(interpretation);
  } catch (error) {
    if (error instanceof GeminiAssistantError) {
      console.error("Error del asistente Gemini:", {
        code: error.code,
        message: error.message,
        diagnostic: error.diagnostic,
      });

      return response.status(error.status).json({
        error: error.message,
        code: error.code,
      });
    }

    console.error("Error inesperado del asistente:", error.message);

    return response.status(502).json({
      error: "No fue posible procesar el mensaje del asistente.",
      code: "ASSISTANT_UNAVAILABLE",
    });
  }
});


/* =========================================================
   REPORTES - STOCK EN PDF

   El archivo se construye exclusivamente con datos actuales
   consultados por el backend. Gemini solo detecta la intención.
   ========================================================= */

app.get("/api/reports/stock.pdf", async (request, response) => {
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

    if (!Array.isArray(productsResponse.data)) {
      return response.status(502).json({
        error: "Integration Suite no devolvió una lista válida de productos.",
        code: "STOCK_REPORT_INVALID_SOURCE",
      });
    }

    const pdfBuffer = await buildStockReport(productsResponse.data);
    const reportDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Lima",
    }).format(new Date());
    const fileName = `reporte-stock-techstore-${reportDate}.pdf`;

    response.set({
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": pdfBuffer.length,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    });

    return response.status(200).send(pdfBuffer);
  } catch (error) {
    const upstreamStatus = error.response?.status;
    const upstreamData = error.response?.data;

    console.error("Error generando reporte de stock:", {
      message: error.message,
      upstreamStatus,
      upstreamData,
    });

    return response.status(502).json({
      error:
        "No fue posible generar el reporte con los datos actuales de stock.",
      code: "STOCK_REPORT_UNAVAILABLE",
      upstreamStatus: upstreamStatus || null,
    });
  }
});


/* =========================================================
   PRODUCTOS - CONSULTA
   ========================================================= */

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


/* =========================================================
   PRODUCTOS - CREACIÓN
   NUEVO
   ========================================================= */

app.post("/api/products", async (request, response) => {
  try {
    const accessToken = await getAccessToken();

    console.log(
      "Producto enviado a Integration Suite:",
      request.body,
    );

    const productResponse = await axios.post(
      process.env.IFLOW_PRODUCTS_CREATE_URL,
      request.body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        timeout: 30_000,
      },
    );

    const sapResult = productResponse.data;

    console.log(
      "Respuesta SAP creación producto:",
      sapResult,
    );

    /*
     * Integration Suite puede devolver HTTP 200 incluso cuando
     * la RFC informa un error mediante BAPIRET2.
     */
    if (isSapErrorResponse(sapResult)) {
      return response.status(422).json({
        error:
          sapResult?.MESSAGE ||
          "SAP rechazó la creación del producto.",

        TYPE: sapResult?.TYPE || "E",
        NUMBER: sapResult?.NUMBER || "",
        MESSAGE:
          sapResult?.MESSAGE ||
          "SAP rechazó la creación del producto.",
      });
    }

    return response.status(200).json(sapResult);
  } catch (error) {
    const upstreamStatus = error.response?.status;
    const upstreamData = error.response?.data;

    console.error("Error creando producto:", {
      message: error.message,
      upstreamStatus,
      upstreamData,
    });

    const message = getUpstreamErrorMessage(
      upstreamData,
      "No fue posible crear el producto mediante Integration Suite.",
    );

    return response.status(502).json({
      error: message,
      upstreamStatus: upstreamStatus || null,
    });
  }
});


/* =========================================================
   CLIENTES - CONSULTA
   ========================================================= */

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

    response
      .status(200)
      .json(customersResponse.data);
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


/* =========================================================
   CLIENTES - CREACIÓN
   NUEVO
   ========================================================= */

app.post("/api/customers", async (request, response) => {
  try {
    const accessToken = await getAccessToken();

    console.log(
      "Cliente enviado a Integration Suite:",
      request.body,
    );

    const customerResponse = await axios.post(
      process.env.IFLOW_CUSTOMERS_CREATE_URL,
      request.body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        timeout: 30_000,
      },
    );

    const sapResult = customerResponse.data;

    console.log(
      "Respuesta SAP creación cliente:",
      sapResult,
    );

    if (isSapErrorResponse(sapResult)) {
      return response.status(422).json({
        error:
          sapResult?.MESSAGE ||
          "SAP rechazó la creación del cliente.",

        TYPE: sapResult?.TYPE || "E",
        NUMBER: sapResult?.NUMBER || "",
        MESSAGE:
          sapResult?.MESSAGE ||
          "SAP rechazó la creación del cliente.",
      });
    }

    return response.status(200).json(sapResult);
  } catch (error) {
    const upstreamStatus = error.response?.status;
    const upstreamData = error.response?.data;

    console.error("Error creando cliente:", {
      message: error.message,
      upstreamStatus,
      upstreamData,
    });

    const message = getUpstreamErrorMessage(
      upstreamData,
      "No fue posible crear el cliente mediante Integration Suite.",
    );

    return response.status(502).json({
      error: message,
      upstreamStatus: upstreamStatus || null,
    });
  }
});


/* =========================================================
   PEDIDOS - CREACIÓN
   ========================================================= */

app.post("/api/orders", async (request, response) => {
  const validationErrors =
    validateOrderPayload(request.body);

  if (validationErrors.length > 0) {
    return response.status(400).json({
      error:
        "El pedido contiene datos inválidos.",
      details: validationErrors,
    });
  }

  try {
    const accessToken = await getAccessToken();

    /*
     * Primera llamada:
     * obtener token CSRF y cookies.
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

    const csrfToken =
      csrfResponse.headers["x-csrf-token"];

    const cookieHeader = buildCookieHeader(
      csrfResponse.headers["set-cookie"],
    );

    if (!csrfToken) {
      throw new Error(
        "Integration Suite no devolvió el token CSRF."
      );
    }

    if (!cookieHeader) {
      throw new Error(
        "Integration Suite no devolvió las cookies de sesión."
      );
    }

    /*
     * Segunda llamada:
     * enviar pedido usando el token CSRF y las cookies.
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

    response
      .status(200)
      .json(orderResponse.data);

    /*
     * Después de crear el pedido aumenta reservedStock.
     * Revisamos alertas sin retrasar la respuesta.
     */
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


/* =========================================================
   INICIAR SERVIDOR
   ========================================================= */

app.listen(PORT, () => {
  console.log(
    `TechStore API ejecutándose en http://localhost:${PORT}`
  );

  console.log(
    `Health: http://localhost:${PORT}/api/health`
  );

  console.log(
    `Productos GET: http://localhost:${PORT}/api/products`
  );

  console.log(
    `Productos POST: http://localhost:${PORT}/api/products`
  );

  console.log(
    `Clientes GET: http://localhost:${PORT}/api/customers`
  );

  console.log(
    `Clientes POST: http://localhost:${PORT}/api/customers`
  );

  console.log(
    `Pedidos: http://localhost:${PORT}/api/orders`
  );

  console.log(
    `Asistente: http://localhost:${PORT}/api/assistant/chat ` +
      `(${String(process.env.GEMINI_API_KEY || "").trim() ? "Gemini" : "modo guiado"})`
  );

  console.log(
    `Reporte stock: http://localhost:${PORT}/api/reports/stock.pdf`
  );
});
