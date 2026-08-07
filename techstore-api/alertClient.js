const axios = require("axios");

/**
 * Obtiene un token OAuth 2.0 (client_credentials) para el
 * Alert Notification Service.
 */
async function getAnsToken() {
  const body = new URLSearchParams({ grant_type: "client_credentials" });

  const response = await axios.post(
    process.env.ANS_OAUTH_URL,
    body.toString(),
    {
      auth: {
        username: process.env.ANS_CLIENT_ID,
        password: process.env.ANS_CLIENT_SECRET,
      },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 15_000,
    }
  );

  return response.data.access_token;
}

/**
 * Envía un evento al producer API de Alert Notification.
 * El campo eventType debe coincidir con la Condition creada en ANS
 * (en nuestro caso: "TechStoreLowStock").
 */
async function sendAlert(event) {
  const token = await getAnsToken();

  await axios.post(
    `${process.env.ANS_URL}/cf/producer/v1/resource-events`,
    event,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 15_000,
    }
  );
}

module.exports = { sendAlert };