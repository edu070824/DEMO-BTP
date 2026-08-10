export const productIcons = {
  LAPTOPS: "💻",
  MONITORES: "🖥️",
  ACCESORIOS: "⌨️",
  TECNOLOGICO: "🎧",
  TECNOLÓGICO: "🎧",
  AUDIFONOS: "🎧",
};

export function getAvailableStock(product) {
  return Math.max(product.stock - product.reservedStock, 0);
}

export function formatPrice(price, currency) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}
