const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const configuredLowStockThreshold = Number(
  process.env.LOW_STOCK_THRESHOLD || 5,
);
const LOW_STOCK_THRESHOLD = Number.isFinite(configuredLowStockThreshold)
  ? Math.max(configuredLowStockThreshold, 0)
  : 5;

const COLORS = {
  accent: "#4f5ff0",
  accentSoft: "#eef1ff",
  cyan: "#48bde2",
  danger: "#dc4a5e",
  green: "#28a86b",
  line: "#dce3ef",
  muted: "#66728a",
  navy: "#0d1730",
  navySoft: "#172540",
  paper: "#ffffff",
  surface: "#f6f8fc",
  text: "#111827",
  warning: "#e59a2f",
};

function numberValue(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function firstValue(source, keys, fallback = "") {
  const matchedKey = keys.find(
    (key) => source?.[key] !== undefined && source?.[key] !== null,
  );

  return matchedKey ? source[matchedKey] : fallback;
}

function normalizeProduct(product, index) {
  const stock = Math.max(
    numberValue(
      firstValue(product, ["stock", "STOCK", "stockTotal", "STOCK_TOTAL"]),
    ),
    0,
  );
  const reservedStock = Math.max(
    numberValue(
      firstValue(product, [
        "reservedStock",
        "RESERVED_STOCK",
        "stockReservado",
        "STOCK_RESERVADO",
      ]),
    ),
    0,
  );
  const explicitAvailable = firstValue(product, [
    "availableStock",
    "AVAILABLE_STOCK",
    "stockDisponible",
    "STOCK_DISPONIBLE",
  ], null);
  const availableStock = Math.max(
    explicitAvailable === null
      ? stock - reservedStock
      : numberValue(explicitAvailable),
    0,
  );

  return {
    availableStock,
    category: String(
      firstValue(product, ["category", "CATEGORY", "categoria", "CATEGORIA"], "Sin categoria"),
    ).trim(),
    id: String(
      firstValue(product, ["id", "ID", "idProducto", "ID_PRODUCTO"], `PRODUCTO-${index + 1}`),
    ).trim(),
    name: String(
      firstValue(product, ["name", "NAME", "nombre", "NOMBRE", "descripcion", "DESCRIPCION"], "Producto sin nombre"),
    ).trim(),
    reservedStock,
    stock,
  };
}

function getStatus(availableStock) {
  if (availableStock <= 0) {
    return { color: COLORS.danger, label: "Agotado" };
  }

  if (availableStock <= LOW_STOCK_THRESHOLD) {
    return { color: COLORS.warning, label: "Stock bajo" };
  }

  return { color: COLORS.green, label: "Disponible" };
}

function pdfSafeText(value) {
  const normalizedText = String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x20-\xFF]/g, "?");

  return [...normalizedText]
    .map((character) => {
      const characterCode = character.charCodeAt(0);

      if (character === "\\" || character === "(" || character === ")") {
        return `\\${character}`;
      }

      if (characterCode > 126 && characterCode <= 255) {
        return `\\${characterCode.toString(8).padStart(3, "0")}`;
      }

      return characterCode <= 126 ? character : "?";
    })
    .join("");
}

function hexToRgb(hexColor) {
  const normalized = hexColor.replace("#", "");
  return [0, 2, 4].map(
    (offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255,
  );
}

function colorCommand(hexColor, stroke = false) {
  const operator = stroke ? "RG" : "rg";
  return `${hexToRgb(hexColor).map((value) => value.toFixed(3)).join(" ")} ${operator}`;
}

function roundedRectPath(x, y, width, height, radius) {
  const right = x + width;
  const bottom = y + height;
  const control = radius * 0.5522847498;

  return [
    `${x + radius} ${y} m`,
    `${right - radius} ${y} l`,
    `${right - radius + control} ${y} ${right} ${y + radius - control} ${right} ${y + radius} c`,
    `${right} ${bottom - radius} l`,
    `${right} ${bottom - radius + control} ${right - radius + control} ${bottom} ${right - radius} ${bottom} c`,
    `${x + radius} ${bottom} l`,
    `${x + radius - control} ${bottom} ${x} ${bottom - radius + control} ${x} ${bottom - radius} c`,
    `${x} ${y + radius} l`,
    `${x} ${y + radius - control} ${x + radius - control} ${y} ${x + radius} ${y} c`,
    "h",
  ].join("\n");
}

function estimateTextWidth(text, fontSize, bold = false) {
  return String(text).length * fontSize * (bold ? 0.56 : 0.51);
}

function truncateText(value, maximumWidth, fontSize, bold = false) {
  const text = String(value || "");

  if (estimateTextWidth(text, fontSize, bold) <= maximumWidth) {
    return text;
  }

  let shortened = text;

  while (
    shortened.length > 1 &&
    estimateTextWidth(`${shortened}...`, fontSize, bold) > maximumWidth
  ) {
    shortened = shortened.slice(0, -1);
  }

  return `${shortened.trim()}...`;
}

class PdfPage {
  constructor() {
    this.commands = [`1 0 0 -1 0 ${A4_HEIGHT} cm`];
  }

  rect(x, y, width, height, fillColor, radius = 0, strokeColor = null) {
    this.commands.push("q");
    this.commands.push(colorCommand(fillColor));

    if (strokeColor) {
      this.commands.push(colorCommand(strokeColor, true));
      this.commands.push("0.8 w");
    }

    this.commands.push(
      radius > 0
        ? roundedRectPath(x, y, width, height, radius)
        : `${x} ${y} ${width} ${height} re`,
    );
    this.commands.push(strokeColor ? "B" : "f");
    this.commands.push("Q");
  }

  line(x1, y1, x2, y2, strokeColor, lineWidth = 1) {
    this.commands.push(
      `q ${colorCommand(strokeColor, true)} ${lineWidth} w ${x1} ${y1} m ${x2} ${y2} l S Q`,
    );
  }

  circle(x, y, radius, fillColor) {
    const control = radius * 0.5522847498;
    this.commands.push("q");
    this.commands.push(colorCommand(fillColor));
    this.commands.push(
      [
        `${x + radius} ${y} m`,
        `${x + radius} ${y + control} ${x + control} ${y + radius} ${x} ${y + radius} c`,
        `${x - control} ${y + radius} ${x - radius} ${y + control} ${x - radius} ${y} c`,
        `${x - radius} ${y - control} ${x - control} ${y - radius} ${x} ${y - radius} c`,
        `${x + control} ${y - radius} ${x + radius} ${y - control} ${x + radius} ${y} c`,
        "f",
      ].join("\n"),
    );
    this.commands.push("Q");
  }

  text(value, x, y, options = {}) {
    const {
      align = "left",
      bold = false,
      color = COLORS.text,
      fontSize = 10,
      maximumWidth = null,
    } = options;
    const visibleText = maximumWidth
      ? truncateText(value, maximumWidth, fontSize, bold)
      : String(value ?? "");
    const textWidth = estimateTextWidth(visibleText, fontSize, bold);
    const textX = align === "right" ? x - textWidth : align === "center" ? x - textWidth / 2 : x;

    this.commands.push(
      `BT /${bold ? "F2" : "F1"} ${fontSize} Tf ${colorCommand(color)} 1 0 0 -1 ${textX.toFixed(2)} ${y.toFixed(2)} Tm (${pdfSafeText(visibleText)}) Tj ET`,
    );
  }

  toString() {
    return `${this.commands.join("\n")}\n`;
  }
}

function drawBrand(page, pageNumber, totalPages) {
  page.circle(52, 39, 11, COLORS.accent);
  page.text("T", 52, 43, {
    align: "center",
    bold: true,
    color: COLORS.paper,
    fontSize: 11,
  });
  page.text("TECHSTORE", 72, 38, {
    bold: true,
    color: COLORS.paper,
    fontSize: 10,
  });
  page.text("SAP BTP", 72, 51, { color: "#aeb9d2", fontSize: 7 });
  page.text(`${pageNumber} / ${totalPages}`, 544, 45, {
    align: "right",
    color: "#aeb9d2",
    fontSize: 8,
  });
}

function drawFooter(page, pageNumber, totalPages) {
  page.line(42, 805, 553, 805, COLORS.line, 0.7);
  page.text("TechStore  |  SAP BTP  |  Integration Suite", 42, 823, {
    color: COLORS.muted,
    fontSize: 7,
  });
  page.text(`Pagina ${pageNumber} de ${totalPages}`, 553, 823, {
    align: "right",
    color: COLORS.muted,
    fontSize: 7,
  });
}

function drawKpi(page, x, label, value, accentColor) {
  page.rect(x, 184, 119, 76, COLORS.surface, 12, COLORS.line);
  page.rect(x, 184, 119, 5, accentColor, 3);
  page.text(label.toUpperCase(), x + 14, 212, {
    bold: true,
    color: COLORS.muted,
    fontSize: 7,
  });
  page.text(String(value), x + 14, 242, {
    bold: true,
    color: COLORS.text,
    fontSize: 22,
  });
}

function buildDashboardPage(products, metrics, generatedAt) {
  const page = new PdfPage();
  page.rect(0, 0, A4_WIDTH, 158, COLORS.navy);
  page.rect(0, 154, A4_WIDTH, 4, COLORS.accent);
  drawBrand(page, 1, metrics.totalPages);

  page.text("Reporte de stock", 42, 88, {
    bold: true,
    color: COLORS.paper,
    fontSize: 27,
  });
  page.text("Disponibilidad actual del catalogo TechStore", 42, 114, {
    color: "#c6d0e5",
    fontSize: 11,
  });
  page.text(`Generado: ${generatedAt}`, 42, 137, {
    color: "#8fa2c4",
    fontSize: 8,
  });

  page.rect(432, 78, 121, 34, COLORS.navySoft, 17, "#2d4168");
  page.circle(449, 95, 4, COLORS.green);
  page.text("DATOS EN TIEMPO REAL", 461, 98, {
    bold: true,
    color: "#c9d5ec",
    fontSize: 6.5,
  });

  drawKpi(page, 42, "Productos", metrics.productCount, COLORS.accent);
  drawKpi(page, 173, "Unidades disponibles", metrics.totalAvailable, COLORS.cyan);
  drawKpi(page, 304, "Stock bajo", metrics.lowStockCount, COLORS.warning);
  drawKpi(page, 435, "Agotados", metrics.outOfStockCount, COLORS.danger);

  page.rect(42, 284, 511, 466, COLORS.surface, 14, COLORS.line);
  page.text("Disponibilidad por producto", 62, 315, {
    bold: true,
    fontSize: 14,
  });
  page.text("Unidades disponibles (stock total menos reservado)", 62, 334, {
    color: COLORS.muted,
    fontSize: 8,
  });

  const chartProducts = [...products]
    .sort((first, second) => second.availableStock - first.availableStock)
    .slice(0, 9);
  const maximumStock = Math.max(
    ...chartProducts.map((product) => product.availableStock),
    1,
  );

  if (chartProducts.length === 0) {
    page.text("No se encontraron productos para representar.", 297, 500, {
      align: "center",
      color: COLORS.muted,
      fontSize: 11,
    });
  } else {
    chartProducts.forEach((product, index) => {
      const rowY = 377 + index * 38;
      const status = getStatus(product.availableStock);
      const barWidth = Math.max((product.availableStock / maximumStock) * 278, 4);

      page.text(product.name, 62, rowY, {
        bold: true,
        fontSize: 8.5,
        maximumWidth: 116,
      });
      page.text(product.id, 62, rowY + 12, {
        color: COLORS.muted,
        fontSize: 6.5,
        maximumWidth: 116,
      });
      page.rect(190, rowY - 10, 278, 11, "#e5eaf3", 5.5);
      page.rect(190, rowY - 10, barWidth, 11, status.color, 5.5);
      page.text(String(product.availableStock), 520, rowY, {
        align: "right",
        bold: true,
        color: status.color,
        fontSize: 9,
      });
    });
  }

  page.line(62, 720, 533, 720, COLORS.line, 0.7);
  page.text(
    chartProducts.length < products.length
      ? `Grafico: ${chartProducts.length} productos con mayor disponibilidad. El detalle completo aparece en las paginas siguientes.`
      : "El detalle completo de stock aparece en la siguiente pagina.",
    62,
    739,
    { color: COLORS.muted, fontSize: 7.5, maximumWidth: 460 },
  );

  drawFooter(page, 1, metrics.totalPages);
  return page;
}

function drawTableHeader(page, y) {
  page.rect(42, y, 511, 30, COLORS.navySoft, 7);
  const headerOptions = { bold: true, color: COLORS.paper, fontSize: 6.5 };
  page.text("ID", 52, y + 19, headerOptions);
  page.text("PRODUCTO", 140, y + 19, headerOptions);
  page.text("TOTAL", 351, y + 19, { ...headerOptions, align: "right" });
  page.text("RESERV.", 411, y + 19, { ...headerOptions, align: "right" });
  page.text("DISP.", 471, y + 19, { ...headerOptions, align: "right" });
  page.text("ESTADO", 542, y + 19, { ...headerOptions, align: "right" });
}

function buildTablePage(products, pageIndex, totalPages, generatedAt) {
  const page = new PdfPage();
  page.rect(0, 0, A4_WIDTH, 112, COLORS.navy);
  page.rect(0, 108, A4_WIDTH, 4, COLORS.accent);
  drawBrand(page, pageIndex, totalPages);
  page.text("Detalle de inventario", 42, 86, {
    bold: true,
    color: COLORS.paper,
    fontSize: 19,
  });
  page.text(`Corte: ${generatedAt}`, 553, 86, {
    align: "right",
    color: "#aeb9d2",
    fontSize: 7.5,
  });

  drawTableHeader(page, 139);
  const rowHeight = 36;

  products.forEach((product, index) => {
    const rowY = 169 + index * rowHeight;
    const status = getStatus(product.availableStock);

    if (index % 2 === 0) {
      page.rect(42, rowY, 511, rowHeight, COLORS.surface);
    }

    page.text(product.id, 52, rowY + 22, {
      color: COLORS.muted,
      fontSize: 7,
      maximumWidth: 78,
    });
    page.text(product.name, 140, rowY + 17, {
      bold: true,
      fontSize: 8,
      maximumWidth: 200,
    });
    page.text(product.category, 140, rowY + 29, {
      color: COLORS.muted,
      fontSize: 6,
      maximumWidth: 200,
    });
    page.text(String(product.stock), 351, rowY + 22, {
      align: "right",
      fontSize: 8,
    });
    page.text(String(product.reservedStock), 411, rowY + 22, {
      align: "right",
      color: COLORS.muted,
      fontSize: 8,
    });
    page.text(String(product.availableStock), 471, rowY + 22, {
      align: "right",
      bold: true,
      color: status.color,
      fontSize: 8,
    });
    page.circle(489, rowY + 18, 3, status.color);
    page.text(status.label, 542, rowY + 22, {
      align: "right",
      bold: true,
      color: status.color,
      fontSize: 6.5,
    });
    page.line(42, rowY + rowHeight, 553, rowY + rowHeight, COLORS.line, 0.45);
  });

  if (products.length === 0) {
    page.text("No hay productos para mostrar.", 297, 286, {
      align: "center",
      color: COLORS.muted,
      fontSize: 11,
    });
  }

  drawFooter(page, pageIndex, totalPages);
  return page;
}

function buildPdf(pages, metadata) {
  const objects = new Map();
  const pageObjectIds = [];
  const contentObjectIds = [];

  objects.set(1, "<< /Type /Catalog /Pages 2 0 R >>");
  objects.set(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  objects.set(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

  pages.forEach((page, index) => {
    const contentId = 5 + index * 2;
    const pageId = contentId + 1;
    const stream = page.toString();
    const streamLength = Buffer.byteLength(stream, "latin1");

    contentObjectIds.push(contentId);
    pageObjectIds.push(pageId);
    objects.set(
      contentId,
      `<< /Length ${streamLength} >>\nstream\n${stream}endstream`,
    );
    objects.set(
      pageId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_WIDTH} ${A4_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
  });

  objects.set(
    2,
    `<< /Type /Pages /Count ${pages.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] >>`,
  );

  const infoId = 5 + pages.length * 2;
  objects.set(
    infoId,
    `<< /Title (${pdfSafeText(metadata.title)}) /Author (TechStore) /Subject (${pdfSafeText(metadata.subject)}) /Creator (TechStore API) /Producer (TechStore PDF Engine) >>`,
  );

  const orderedIds = [...objects.keys()].sort((first, second) => first - second);
  const buffers = [Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "latin1")];
  const offsets = new Map();
  let currentOffset = buffers[0].length;

  orderedIds.forEach((id) => {
    const objectBuffer = Buffer.from(
      `${id} 0 obj\n${objects.get(id)}\nendobj\n`,
      "latin1",
    );
    offsets.set(id, currentOffset);
    buffers.push(objectBuffer);
    currentOffset += objectBuffer.length;
  });

  const xrefOffset = currentOffset;
  const maximumId = Math.max(...orderedIds);
  const xrefEntries = ["0000000000 65535 f "];

  for (let id = 1; id <= maximumId; id += 1) {
    const offset = offsets.get(id);
    xrefEntries.push(
      offset === undefined
        ? "0000000000 00000 f "
        : `${String(offset).padStart(10, "0")} 00000 n `,
    );
  }

  buffers.push(
    Buffer.from(
      `xref\n0 ${maximumId + 1}\n${xrefEntries.join("\n")}\ntrailer\n<< /Size ${maximumId + 1} /Root 1 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
      "latin1",
    ),
  );

  return Buffer.concat(buffers);
}

async function buildStockReport(rawProducts) {
  if (!Array.isArray(rawProducts)) {
    throw new TypeError("La fuente de productos del reporte no es un arreglo.");
  }

  const products = rawProducts.map(normalizeProduct);
  const rowsPerPage = 17;
  const tableChunks = [];

  if (products.length === 0) {
    tableChunks.push([]);
  } else {
    for (let index = 0; index < products.length; index += rowsPerPage) {
      tableChunks.push(products.slice(index, index + rowsPerPage));
    }
  }

  const totalPages = 1 + tableChunks.length;
  const generatedAt = new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date());
  const metrics = {
    lowStockCount: products.filter(
      (product) =>
        product.availableStock > 0 &&
        product.availableStock <= LOW_STOCK_THRESHOLD,
    ).length,
    outOfStockCount: products.filter(
      (product) => product.availableStock <= 0,
    ).length,
    productCount: products.length,
    totalAvailable: products.reduce(
      (total, product) => total + product.availableStock,
      0,
    ),
    totalPages,
  };
  const pages = [buildDashboardPage(products, metrics, generatedAt)];

  tableChunks.forEach((chunk, index) => {
    pages.push(buildTablePage(chunk, index + 2, totalPages, generatedAt));
  });

  return buildPdf(pages, {
    subject: "Stock disponible del catalogo conectado con SAP",
    title: "Reporte de stock TechStore",
  });
}

module.exports = {
  buildStockReport,
  normalizeProduct,
};
