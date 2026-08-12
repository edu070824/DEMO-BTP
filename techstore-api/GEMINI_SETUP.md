# Configuración del asistente Gemini

La clave de Gemini debe configurarse únicamente en el backend. No debe
agregarse a archivos de React ni a variables que empiecen con `VITE_`, porque
esas variables quedan visibles en el navegador.

## Activación

1. Abre `techstore-api/.env`.
2. Agrega estas variables:

```env
GEMINI_API_KEY=PEGA_AQUI_TU_CLAVE_REAL
GEMINI_MODEL=gemini-3.5-flash-lite
```

3. Reinicia el backend:

```bash
npm run dev
```

`GEMINI_MODEL` es opcional. Si no se declara, el backend utiliza
`gemini-3.5-flash-lite`. Si el `.env` todavía contiene
`GEMINI_MODEL=gemini-2.5-flash`, el backend lo migra automáticamente al modelo
nuevo porque Google ya no ofrece el modelo 2.5 a usuarios nuevos.

La integración utiliza `POST /v1beta/interactions`, el endpoint recomendado
actualmente por Google. Las conversaciones no se almacenan en Gemini porque la
solicitud se envía con `store: false`.

Si Google rechaza una solicitud, el terminal muestra el estado y el mensaje
del proveedor dentro de `diagnostic`. La clave siempre se reemplaza por
`[CLAVE OCULTA]` antes de escribir el diagnóstico.

## Diseño seguro del flujo

- Gemini interpreta el lenguaje libre y devuelve datos estructurados.
- Gemini no conoce ni recibe las credenciales de SAP BTP.
- Gemini nunca llama directamente a Integration Suite ni crea pedidos.
- TechStore vuelve a validar el producto, el stock, el cliente y los datos del
  pedido.
- El pedido solo se envía a `/api/orders` después de una confirmación explícita
  del usuario.
- Si Gemini no está configurado o está temporalmente indisponible, el asistente
  conserva el modo guiado y sus botones rápidos.

## Reportes de stock en PDF

El asistente también reconoce solicitudes como “genera un PDF del stock” o
“quiero un reporte de inventario con gráfico”. Gemini solo clasifica esa
intención; el archivo no lo fabrica el modelo.

El backend consulta nuevamente `IFLOW_PRODUCTS_URL`, calcula stock total,
reservado y disponible, y genera un PDF A4 con indicadores, gráfico y tabla
paginada. El endpoint es `GET /api/reports/stock.pdf` y funciona también en
modo guiado mediante la opción rápida “Reporte de stock PDF”. Esta función no
crea ni modifica información en SAP.
