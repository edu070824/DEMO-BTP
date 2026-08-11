# Configuración del asistente Gemini

La clave de Gemini debe configurarse únicamente en el backend. No debe
agregarse a archivos de React ni a variables que empiecen con `VITE_`, porque
esas variables quedan visibles en el navegador.

## Activación

1. Abre `techstore-api/.env`.
2. Agrega estas variables:

```env
GEMINI_API_KEY=PEGA_AQUI_TU_CLAVE_REAL
GEMINI_MODEL=gemini-2.5-flash
```

3. Reinicia el backend:

```bash
npm run dev
```

`GEMINI_MODEL` es opcional. Si no se declara, el backend utiliza
`gemini-2.5-flash`.

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

