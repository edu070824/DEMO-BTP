import { useRef, useState } from "react";
import { createOrder } from "../services/api";
import { getAvailableStock } from "../utils/products";

const initialDraft = {
  customer: null,
  observation: "",
  product: null,
  quantity: 1,
  seller: "",
};

const numberWords = {
  una: 1,
  uno: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getCurrentTime() {
  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function createInitialMessages() {
  return [
    {
      id: "assistant-welcome",
      role: "assistant",
      text:
        "¡Hola! Soy el asistente de TechStore. Puedo ayudarte a crear un pedido conectado con SAP paso a paso.",
      time: getCurrentTime(),
    },
  ];
}

function findEntity(input, entities, fields) {
  const normalizedInput = normalizeText(input);

  const exactMatch = entities.find((entity) =>
    fields.some((field) => normalizeText(entity[field]) === normalizedInput),
  );

  if (exactMatch) {
    return exactMatch;
  }

  const indexMatch = normalizedInput.match(/(?:opcion|producto|cliente)?\s*(\d+)$/);

  if (indexMatch) {
    const entityByIndex = entities[Number(indexMatch[1]) - 1];

    if (entityByIndex) {
      return entityByIndex;
    }
  }

  const partialMatches = entities.filter((entity) =>
    fields.some((field) => {
      const normalizedField = normalizeText(entity[field]);
      return (
        normalizedField.includes(normalizedInput) ||
        normalizedInput.includes(normalizedField)
      );
    }),
  );

  return partialMatches.length === 1 ? partialMatches[0] : null;
}

function parseQuantity(input) {
  const normalizedInput = normalizeText(input);
  const numberMatch = normalizedInput.match(/\d+/);

  if (numberMatch) {
    return Number(numberMatch[0]);
  }

  const matchedWord = Object.keys(numberWords).find((word) =>
    normalizedInput.split(/\s+/).includes(word),
  );

  return matchedWord ? numberWords[matchedWord] : Number.NaN;
}

function isAffirmative(input) {
  const normalizedInput = normalizeText(input);
  return [
    "si",
    "confirmar",
    "confirmo",
    "crear",
    "crear pedido",
    "confirmar pedido",
    "adelante",
    "correcto",
  ].includes(normalizedInput);
}

function isCancelCommand(input) {
  const normalizedInput = normalizeText(input);
  return ["cancelar", "cancelar pedido", "salir", "detener"].includes(
    normalizedInput,
  );
}

function useOrderAssistant({ customers, products, refreshProducts }) {
  const messageSequence = useRef(0);
  const [draft, setDraft] = useState(initialDraft);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState(createInitialMessages);
  const [step, setStep] = useState("welcome");

  const availableProducts = products.filter(
    (product) => getAvailableStock(product) > 0,
  );

  function createMessage(role, text, status = "") {
    messageSequence.current += 1;

    return {
      id: `${role}-${messageSequence.current}`,
      role,
      status,
      text,
      time: getCurrentTime(),
    };
  }

  function appendAssistant(text, status = "") {
    setMessages((currentMessages) => [
      ...currentMessages,
      createMessage("assistant", text, status),
    ]);
  }

  function appendUser(text) {
    setMessages((currentMessages) => [
      ...currentMessages,
      createMessage("user", text),
    ]);
  }

  function beginOrder() {
    setDraft(initialDraft);

    if (availableProducts.length === 0) {
      setStep("welcome");
      appendAssistant(
        "Ahora mismo no encuentro productos con stock disponible. Puedes intentarlo nuevamente cuando el catálogo esté actualizado.",
        "error",
      );
      return;
    }

    setStep("product");
    appendAssistant(
      "Claro. Estos son los productos disponibles. Elige uno por su nombre, código o número de la lista.",
    );
  }

  function restartConversation() {
    setDraft(initialDraft);
    setIsSubmitting(false);
    setMessages(createInitialMessages());
    setStep("welcome");
  }

  function cancelCurrentOrder() {
    setDraft(initialDraft);
    setStep("welcome");
    appendAssistant(
      "Pedido cancelado. No se envió ninguna información a SAP. Cuando quieras, podemos comenzar de nuevo.",
    );
  }

  async function submitOrder() {
    const currentProduct = products.find(
      (product) => product.id === draft.product?.id && product.active,
    );
    const currentCustomer = customers.find(
      (customer) => customer.id === draft.customer?.id && customer.active,
    );

    if (
      !currentProduct ||
      getAvailableStock(currentProduct) < draft.quantity
    ) {
      setDraft((currentDraft) => ({
        ...currentDraft,
        product: null,
        quantity: 1,
      }));
      setStep("product");
      appendAssistant(
        "El stock cambió antes de confirmar. Por seguridad, elige nuevamente un producto disponible.",
        "error",
      );
      return;
    }

    if (!currentCustomer) {
      setDraft((currentDraft) => ({
        ...currentDraft,
        customer: null,
      }));
      setStep("customer");
      appendAssistant(
        "El cliente seleccionado ya no está disponible. Elige otro cliente para continuar.",
        "error",
      );
      return;
    }

    const orderPayload = {
      IS_CABECERA: {
        ID_CLIENTE: currentCustomer.id,
        MONEDA: currentProduct.currency,
        OBSERVACION: draft.observation.trim(),
        VENDEDOR: draft.seller.trim(),
      },
      IT_POSICIONES: {
        item: [
          {
            CANTIDAD: draft.quantity,
            ID_PRODUCTO: currentProduct.id,
          },
        ],
      },
    };

    setIsSubmitting(true);
    setStep("submitting");

    try {
      const result = await createOrder(orderPayload);
      const responseType = String(result?.TYPE || "").trim().toUpperCase();

      if (["E", "A", "X"].includes(responseType)) {
        throw new Error(result?.MESSAGE || "SAP rechazó la creación del pedido.");
      }

      const orderId = result?.EV_ID_PEDIDO || result?.NUMBER || "";

      appendAssistant(
        orderId
          ? `¡Pedido creado correctamente! SAP devolvió el identificador ${orderId}.`
          : result?.MESSAGE || "¡Pedido creado correctamente en SAP!",
        "success",
      );
      setStep("completed");

      refreshProducts().catch((refreshError) => {
        console.error(
          "Pedido creado, pero no se pudo refrescar el catálogo:",
          refreshError,
        );
      });
    } catch (error) {
      appendAssistant(
        error instanceof Error
          ? `No pude crear el pedido: ${error.message}`
          : "No pude crear el pedido. Intenta nuevamente.",
        "error",
      );
      setStep("confirm");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function sendMessage(rawInput, displayText = "") {
    const input = String(rawInput || "").trim();

    if (!input || isSubmitting) {
      return;
    }

    appendUser(displayText || input);

    if (input === "__restart__") {
      beginOrder();
      return;
    }

    if (input === "__cancel__" || isCancelCommand(input)) {
      cancelCurrentOrder();
      return;
    }

    if (input === "__edit_product__") {
      setDraft((currentDraft) => ({
        ...currentDraft,
        product: null,
        quantity: 1,
      }));
      setStep("product");
      appendAssistant("Perfecto. Elige nuevamente el producto que deseas.");
      return;
    }

    if (input === "__edit_customer__") {
      setDraft((currentDraft) => ({
        ...currentDraft,
        customer: null,
      }));
      setStep("customer");
      appendAssistant("Perfecto. Elige nuevamente el cliente del pedido.");
      return;
    }

    if (step === "welcome" || step === "completed") {
      const normalizedInput = normalizeText(input);
      const wantsOrder =
        input === "__start__" ||
        normalizedInput.includes("pedido") ||
        normalizedInput.includes("comprar") ||
        normalizedInput.includes("orden");

      if (wantsOrder) {
        beginOrder();
      } else {
        appendAssistant(
          "Puedo guiarte para crear un pedido. Escribe “Quiero realizar un pedido” o utiliza el botón de inicio.",
        );
      }
      return;
    }

    if (step === "product") {
      const productId = input.startsWith("__product__:")
        ? input.slice("__product__:".length)
        : input;
      const product = findEntity(productId, availableProducts, [
        "id",
        "name",
        "category",
      ]);

      if (!product) {
        appendAssistant(
          "No pude identificar un único producto. Elige una tarjeta o escribe el código exacto del producto.",
          "error",
        );
        return;
      }

      setDraft((currentDraft) => ({ ...currentDraft, product }));
      setStep("quantity");
      appendAssistant(
        `Elegiste ${product.name}. Hay ${getAvailableStock(product)} unidades disponibles. ¿Qué cantidad deseas?`,
      );
      return;
    }

    if (step === "quantity") {
      const quantity = parseQuantity(input);
      const maximumQuantity = getAvailableStock(draft.product);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        appendAssistant(
          "Indícame una cantidad válida mayor que cero. Por ejemplo: 1, 2 o 3 unidades.",
          "error",
        );
        return;
      }

      if (quantity > maximumQuantity) {
        appendAssistant(
          `Solo hay ${maximumQuantity} unidades disponibles. Elige una cantidad menor o igual.`,
          "error",
        );
        return;
      }

      setDraft((currentDraft) => ({ ...currentDraft, quantity }));

      if (customers.length === 0) {
        setStep("welcome");
        appendAssistant(
          "No encuentro clientes activos para continuar. El pedido no fue enviado.",
          "error",
        );
        return;
      }

      setStep("customer");
      appendAssistant(
        "Perfecto. Ahora selecciona el cliente que recibirá el pedido.",
      );
      return;
    }

    if (step === "customer") {
      const customerId = input.startsWith("__customer__:")
        ? input.slice("__customer__:".length)
        : input;
      const customer = findEntity(customerId, customers, ["id", "name"]);

      if (!customer) {
        appendAssistant(
          "No pude identificar un único cliente. Elige una tarjeta o escribe su código exacto.",
          "error",
        );
        return;
      }

      setDraft((currentDraft) => ({ ...currentDraft, customer }));
      setStep("seller");
      appendAssistant(
        `Cliente seleccionado: ${customer.name}. ¿Qué código de vendedor utilizaremos?`,
      );
      return;
    }

    if (step === "seller") {
      const seller =
        input === "__default_seller__" ? "VENDEDOR01" : input.trim();

      if (!seller) {
        appendAssistant("El código de vendedor es obligatorio.", "error");
        return;
      }

      if (seller.length > 20) {
        appendAssistant(
          "El código de vendedor debe tener como máximo 20 caracteres.",
          "error",
        );
        return;
      }

      setDraft((currentDraft) => ({ ...currentDraft, seller }));
      setStep("observation");
      appendAssistant(
        "Casi terminamos. Escribe una observación para el pedido o utiliza la sugerencia predeterminada.",
      );
      return;
    }

    if (step === "observation") {
      const normalizedInput = normalizeText(input);
      const observation =
        input === "__default_observation__"
          ? "PEDIDO CREADO DESDE ASISTENTE WEB"
          : normalizedInput === "sin observacion"
            ? ""
            : input.trim();

      setDraft((currentDraft) => ({ ...currentDraft, observation }));
      setStep("confirm");
      appendAssistant(
        "He preparado el resumen. Revísalo cuidadosamente y confirma solo si toda la información es correcta.",
      );
      return;
    }

    if (step === "confirm") {
      if (input === "__confirm__" || isAffirmative(input)) {
        await submitOrder();
        return;
      }

      appendAssistant(
        "El pedido aún no fue enviado. Puedes confirmar, cambiar el producto, cambiar el cliente o cancelar.",
      );
    }
  }

  function getActions() {
    if (isSubmitting || step === "submitting") {
      return [];
    }

    if (step === "welcome") {
      return [
        {
          label: "Crear un pedido",
          type: "primary",
          value: "__start__",
        },
      ];
    }

    if (step === "product") {
      return availableProducts.map((product, index) => ({
        detail: `${getAvailableStock(product)} disponibles`,
        icon: product.category,
        label: product.name,
        meta: `${index + 1}. ${product.id}`,
        type: "product",
        value: `__product__:${product.id}`,
      }));
    }

    if (step === "quantity") {
      const maximumQuantity = getAvailableStock(draft.product);
      return Array.from({ length: Math.min(maximumQuantity, 4) }, (_, index) => ({
        label: `${index + 1} ${index === 0 ? "unidad" : "unidades"}`,
        type: "chip",
        value: String(index + 1),
      }));
    }

    if (step === "customer") {
      return customers.map((customer, index) => ({
        detail: customer.documentNumber,
        label: customer.name,
        meta: `${index + 1}. ${customer.id}`,
        type: "customer",
        value: `__customer__:${customer.id}`,
      }));
    }

    if (step === "seller") {
      return [
        {
          label: "Usar VENDEDOR01",
          type: "primary",
          value: "__default_seller__",
        },
      ];
    }

    if (step === "observation") {
      return [
        {
          label: "Usar observación predeterminada",
          type: "primary",
          value: "__default_observation__",
        },
        {
          label: "Sin observación",
          type: "chip",
          value: "Sin observación",
        },
      ];
    }

    if (step === "confirm") {
      return [
        {
          label: "Confirmar y crear pedido",
          type: "confirm",
          value: "__confirm__",
        },
        {
          label: "Cambiar producto",
          type: "chip",
          value: "__edit_product__",
        },
        {
          label: "Cambiar cliente",
          type: "chip",
          value: "__edit_customer__",
        },
        {
          label: "Cancelar",
          type: "danger",
          value: "__cancel__",
        },
      ];
    }

    if (step === "completed") {
      return [
        {
          label: "Crear otro pedido",
          type: "primary",
          value: "__restart__",
        },
      ];
    }

    return [];
  }

  const placeholders = {
    confirm: "Escribe “confirmar” o modifica el pedido...",
    customer: "Escribe el cliente o su código...",
    observation: "Escribe una observación...",
    product: "Escribe el producto o su código...",
    quantity: "Indica la cantidad...",
    seller: "Escribe el código del vendedor...",
    welcome: "¿En qué puedo ayudarte?",
  };

  return {
    actions: getActions(),
    draft,
    isSubmitting,
    messages,
    placeholder: placeholders[step] || "Escribe un mensaje...",
    restartConversation,
    sendMessage,
    step,
  };
}

export default useOrderAssistant;
