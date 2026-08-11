import { useRef, useState } from "react";
import {
  createOrder,
  interpretAssistantMessage,
} from "../services/api";
import { getAvailableStock } from "../utils/products";

const initialDraft = {
  customer: null,
  observation: null,
  product: null,
  quantity: 0,
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
        "¡Hola! Soy el asistente inteligente de TechStore. Puedes pedirme un pedido con tus propias palabras o utilizar las opciones rápidas.",
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

  const indexMatch = normalizedInput.match(
    /(?:opcion|producto|cliente)?\s*(\d+)$/,
  );

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

function findEntityById(entityId, entities) {
  const normalizedId = normalizeText(entityId);

  return entities.find((entity) => normalizeText(entity.id) === normalizedId);
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

function isExplicitConfirmation(input) {
  const normalizedInput = normalizeText(input).replace(/[.,!¡¿?]/g, "");

  return [
    "si",
    "confirmar",
    "confirmo",
    "crear",
    "crear pedido",
    "crea el pedido",
    "confirmar pedido",
    "confirmo el pedido",
    "adelante",
    "correcto",
    "todo correcto",
  ].includes(normalizedInput);
}

function isCancelCommand(input) {
  const normalizedInput = normalizeText(input);

  return ["cancelar", "cancelar pedido", "salir", "detener"].includes(
    normalizedInput,
  );
}

function getNextRequiredStep(orderDraft) {
  if (!orderDraft.product) {
    return "product";
  }

  if (!Number.isInteger(orderDraft.quantity) || orderDraft.quantity <= 0) {
    return "quantity";
  }

  if (!orderDraft.customer) {
    return "customer";
  }

  if (!orderDraft.seller.trim()) {
    return "seller";
  }

  if (orderDraft.observation === null) {
    return "observation";
  }

  return "confirm";
}

function useOrderAssistant({ customers, products, refreshProducts }) {
  const messageSequence = useRef(0);
  const busyRef = useRef(false);
  const [assistantMode, setAssistantMode] = useState("checking");
  const [draft, setDraft] = useState(initialDraft);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
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
      "Claro. Estos son los productos disponibles. Puedes elegir una tarjeta o escribir el nombre o código del producto.",
    );
  }

  function restartConversation() {
    if (isSubmitting) {
      return;
    }

    busyRef.current = false;
    setDraft(initialDraft);
    setIsThinking(false);
    setMessages(createInitialMessages());
    setStep("welcome");
  }

  function cancelCurrentOrder(message) {
    setDraft(initialDraft);
    setStep("welcome");
    appendAssistant(
      message ||
        "Pedido cancelado. No se envió ninguna información a SAP. Cuando quieras, podemos comenzar de nuevo.",
    );
  }

  async function submitOrder(orderDraft = draft) {
    const currentProduct = products.find(
      (product) => product.id === orderDraft.product?.id && product.active,
    );
    const currentCustomer = customers.find(
      (customer) => customer.id === orderDraft.customer?.id && customer.active,
    );

    if (
      !currentProduct ||
      getAvailableStock(currentProduct) < orderDraft.quantity
    ) {
      setDraft((currentDraft) => ({
        ...currentDraft,
        product: null,
        quantity: 0,
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

    if (
      !orderDraft.seller.trim() ||
      orderDraft.seller.trim().length > 20 ||
      orderDraft.observation === null
    ) {
      setStep(getNextRequiredStep(orderDraft));
      appendAssistant(
        "Faltan datos obligatorios del pedido. Complétalos antes de confirmar.",
        "error",
      );
      return;
    }

    const orderPayload = {
      IS_CABECERA: {
        ID_CLIENTE: currentCustomer.id,
        MONEDA: currentProduct.currency,
        OBSERVACION: orderDraft.observation.trim(),
        VENDEDOR: orderDraft.seller.trim(),
      },
      IT_POSICIONES: {
        item: [
          {
            CANTIDAD: orderDraft.quantity,
            ID_PRODUCTO: currentProduct.id,
          },
        ],
      },
    };

    busyRef.current = true;
    setIsSubmitting(true);
    setStep("submitting");

    try {
      const result = await createOrder(orderPayload);
      const responseType = String(result?.TYPE || "").trim().toUpperCase();

      if (["E", "A", "X"].includes(responseType)) {
        throw new Error(
          result?.MESSAGE || "SAP rechazó la creación del pedido.",
        );
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
      busyRef.current = false;
      setIsSubmitting(false);
    }
  }

  function buildGeminiPayload(input) {
    return {
      message: input,
      step,
      draft: {
        productId: draft.product?.id || "",
        quantity: draft.quantity,
        customerId: draft.customer?.id || "",
        seller: draft.seller,
        observation: draft.observation,
      },
      history: messages.map((message) => ({
        role: message.role,
        text: message.text,
      })),
      products: availableProducts.map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        currency: product.currency,
        price: product.price,
        availableStock: getAvailableStock(product),
      })),
      customers: customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        documentNumber: customer.documentNumber,
      })),
    };
  }

  function mergeGeminiDraft(interpretation) {
    const nextDraft = { ...draft };
    const validationErrors = [];
    const clearedFields = new Set(interpretation.clearFields || []);

    if (clearedFields.has("product")) {
      nextDraft.product = null;
      nextDraft.quantity = 0;
    }

    if (clearedFields.has("quantity")) {
      nextDraft.quantity = 0;
    }

    if (clearedFields.has("customer")) {
      nextDraft.customer = null;
    }

    if (clearedFields.has("seller")) {
      nextDraft.seller = "";
    }

    if (clearedFields.has("observation")) {
      nextDraft.observation = null;
    }

    if (interpretation.productId) {
      const selectedProduct = findEntityById(
        interpretation.productId,
        availableProducts,
      );

      if (!selectedProduct) {
        validationErrors.push(
          "No pude validar ese producto contra el catálogo disponible.",
        );
      } else {
        const productChanged = nextDraft.product?.id !== selectedProduct.id;
        nextDraft.product = selectedProduct;

        if (productChanged && !interpretation.quantity) {
          nextDraft.quantity = 0;
        }
      }
    }

    if (interpretation.quantity > 0) {
      if (!nextDraft.product) {
        validationErrors.push(
          "Primero necesito identificar el producto para validar la cantidad.",
        );
      } else if (
        interpretation.quantity > getAvailableStock(nextDraft.product)
      ) {
        validationErrors.push(
          `Solo hay ${getAvailableStock(nextDraft.product)} unidades disponibles de ${nextDraft.product.name}.`,
        );
        nextDraft.quantity = 0;
      } else {
        nextDraft.quantity = interpretation.quantity;
      }
    }

    if (interpretation.customerId) {
      const selectedCustomer = findEntityById(
        interpretation.customerId,
        customers,
      );

      if (!selectedCustomer) {
        validationErrors.push(
          "No pude validar ese cliente contra la lista de clientes activos.",
        );
      } else {
        nextDraft.customer = selectedCustomer;
      }
    }

    if (interpretation.seller) {
      if (interpretation.seller.length > 20) {
        validationErrors.push(
          "El código de vendedor debe tener como máximo 20 caracteres.",
        );
      } else {
        nextDraft.seller = interpretation.seller;
      }
    }

    if (interpretation.observationProvided) {
      nextDraft.observation = String(interpretation.observation || "").trim();
    }

    return { nextDraft, validationErrors };
  }

  async function applyGeminiInterpretation(interpretation, input) {
    if (interpretation.action === "cancel_order") {
      cancelCurrentOrder(interpretation.reply);
      return;
    }

    if (interpretation.action === "reset_order") {
      setDraft(initialDraft);
      setStep("product");
      appendAssistant(interpretation.reply);
      return;
    }

    if (interpretation.action === "start_order" && availableProducts.length === 0) {
      setStep("welcome");
      appendAssistant(
        "Quiero ayudarte, pero ahora mismo no hay productos con stock disponible.",
        "error",
      );
      return;
    }

    const { nextDraft, validationErrors } = mergeGeminiDraft(interpretation);

    setDraft(nextDraft);

    if (validationErrors.length > 0) {
      setStep(getNextRequiredStep(nextDraft));
      appendAssistant(validationErrors.join(" "), "error");
      return;
    }

    const nextRequiredStep = getNextRequiredStep(nextDraft);
    const draftChanged =
      nextDraft.product !== draft.product ||
      nextDraft.quantity !== draft.quantity ||
      nextDraft.customer !== draft.customer ||
      nextDraft.seller !== draft.seller ||
      nextDraft.observation !== draft.observation;

    if (interpretation.action === "confirm_order") {
      setStep(nextRequiredStep);

      if (
        nextRequiredStep === "confirm" &&
        isExplicitConfirmation(input)
      ) {
        await submitOrder(nextDraft);
        return;
      }

      appendAssistant(
        nextRequiredStep === "confirm"
          ? "El resumen está preparado, pero necesito una confirmación explícita. Escribe “confirmar” o utiliza el botón verde."
          : "Todavía faltan datos antes de poder confirmar el pedido.",
      );
      return;
    }

    if (
      interpretation.action === "start_order" ||
      interpretation.action === "update_draft" ||
      interpretation.action === "request_confirmation" ||
      draftChanged
    ) {
      setStep(nextRequiredStep);
    }

    if (
      interpretation.action === "start_order" &&
      !nextDraft.product
    ) {
      setStep("product");
    } else if (
      interpretation.showProducts &&
      !nextDraft.product
    ) {
      setStep("product");
    } else if (
      interpretation.showCustomers &&
      !nextDraft.customer
    ) {
      setStep("customer");
    }

    appendAssistant(interpretation.reply);
  }

  async function processGuidedInput(
    input,
    displayText = "",
    appendUserMessage = true,
  ) {
    if (appendUserMessage) {
      appendUser(displayText || input);
    }

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
        quantity: 0,
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

      setDraft((currentDraft) => ({
        ...currentDraft,
        product,
        quantity: 0,
      }));
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
      if (input === "__confirm__" || isExplicitConfirmation(input)) {
        await submitOrder(draft);
        return;
      }

      appendAssistant(
        "El pedido aún no fue enviado. Puedes confirmar, cambiar el producto, cambiar el cliente o cancelar.",
      );
    }
  }

  async function sendMessage(rawInput, displayText = "") {
    const input = String(rawInput || "").trim();

    if (!input || isSubmitting || isThinking || busyRef.current) {
      return;
    }

    const isGuidedAction = input.startsWith("__");

    if (isGuidedAction || assistantMode === "guided") {
      await processGuidedInput(input, displayText);
      return;
    }

    appendUser(displayText || input);
    busyRef.current = true;
    setIsThinking(true);

    try {
      const interpretation = await interpretAssistantMessage(
        buildGeminiPayload(input),
      );

      setAssistantMode("gemini");
      await applyGeminiInterpretation(interpretation, input);
    } catch (error) {
      console.warn(
        "Gemini no está disponible; se utilizará el modo guiado:",
        error,
      );
      setAssistantMode("guided");
      appendAssistant(
        "Gemini no está disponible en este momento. Continuaré en modo guiado y los botones rápidos seguirán funcionando.",
      );
      await processGuidedInput(input, "", false);
    } finally {
      busyRef.current = false;
      setIsThinking(false);
    }
  }

  function getActions() {
    if (isSubmitting || isThinking || step === "submitting") {
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

      return Array.from(
        { length: Math.min(maximumQuantity, 4) },
        (_, index) => ({
          label: `${index + 1} ${index === 0 ? "unidad" : "unidades"}`,
          type: "chip",
          value: String(index + 1),
        }),
      );
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
    confirm: "Confirma o pide un cambio con tus palabras...",
    customer: "Escribe el cliente o su código...",
    observation: "Escribe una observación...",
    product: "Escribe el producto o su código...",
    quantity: "Indica la cantidad...",
    seller: "Escribe el código del vendedor...",
    welcome: "Escribe libremente: “Quiero hacer un pedido”...",
  };

  return {
    actions: getActions(),
    assistantMode,
    draft,
    isSubmitting,
    isThinking,
    messages,
    placeholder: placeholders[step] || "Escribe un mensaje...",
    restartConversation,
    sendMessage,
    step,
  };
}

export default useOrderAssistant;
