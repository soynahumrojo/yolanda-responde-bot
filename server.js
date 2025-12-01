const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = "yolanda-verificacion"; 
const IG_TOKEN = process.env.IG_TOKEN;

// =========================
// VERIFICACIÓN DEL WEBHOOK
// =========================
app.get("/webhook", (req, res) => {
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    console.log("Webhook verificado.");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// =========================
// RECEPCIÓN DE EVENTOS IG
// =========================
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "instagram") {
    for (const entry of body.entry) {
      const changes = entry.changes || [];

      for (const change of changes) {
        if (change.field === "comments") {
          const commentId = change.value.id;
          const text = change.value.text;

          console.log("Nuevo comentario:", text);

          // Respuesta automática
          await responderComentario(commentId, text);
        }
      }
    }

    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// =========================
// FUNCIÓN PARA RESPONDER
// =========================
async function responderComentario(commentId, text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${commentId}/replies`,
      {
        message: `¡Gracias por tu comentario! 😊`,
      },
      {
        params: { access_token: IG_TOKEN },
      }
    );

    console.log("Respuesta enviada");
  } catch (error) {
    console.error("ERROR EN RESPUESTA:", error.response?.data || error.message);
  }
}

app.listen(3000, () => console.log("Servidor Yolanda activo en puerto 3000"));
