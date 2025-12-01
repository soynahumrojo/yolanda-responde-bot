// server.js
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// ==========================
// CONFIGURACIÓN DE TOKENS
// ==========================

// Este token es SOLO para verificar el webhook con Meta.
// Lo mismo debes poner en el panel de Meta en "Token de verificación".
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "yolanda-verificacion";

// Token de acceso de Instagram (el largo que generaste en Meta).
// NO lo pongas aquí directamente, va en variables de entorno (IG_TOKEN).
const IG_TOKEN = process.env.IG_TOKEN;

// ==========================
// RUTA SIMPLE PARA PROBAR
// ==========================

app.get("/", (req, res) => {
  res.send("Yolanda Responde está viva 🧠✨");
});

// ==========================
// VERIFICACIÓN DEL WEBHOOK
// (GET /webhook)
// ==========================

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("Intento de verificación:", { mode, token, challenge });

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado correctamente");
    res.status(200).send(challenge);
  } else {
    console.log("❌ Falló la verificación del webhook");
    res.sendStatus(403);
  }
});

// ==========================
// RECEPCIÓN DE EVENTOS IG
// (POST /webhook)
// ==========================

app.post("/webhook", async (req, res) => {
  const body = req.body;

  console.log("📩 Webhook recibido:");
  console.dir(body, { depth: null });

  // Confirmar que viene de Instagram
  if (body.object === "instagram") {
    for (const entry of body.entry || []) {
      const changes = entry.changes || [];

      for (const change of changes) {
        // Nos interesan eventos de comentarios
        if (change.field === "comments") {
          const commentId = change.value.id;
          const text = change.value.text;

          console.log("📝 Nuevo comentario:", text, "ID:", commentId);

          // Aquí luego meteremos IA, por ahora respuesta fija
          await responderComentario(commentId, text);
        }
      }
    }

    // Meta necesita 200 OK rápido
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// ==========================
// FUNCIÓN PARA RESPONDER
// ==========================

async function responderComentario(commentId, text) {
  if (!IG_TOKEN) {
    console.error("❌ IG_TOKEN no está definido en variables de entorno");
    return;
  }

  try {
    // Aquí luego podemos generar el mensaje con IA.
    const respuesta = `¡Gracias por tu comentario! 🫶`;

    const url = `https://graph.facebook.com/v19.0/${commentId}/replies`;

    const payload = {
      message: respuesta,
    };

    const params = {
      access_token: IG_TOKEN,
    };

    const { data } = await axios.post(url, payload, { params });

    console.log("✅ Respuesta enviada correctamente:", data);
  } catch (error) {
    console.error(
      "🚨 ERROR EN RESPUESTA:",
      error.response?.data || error.message
    );
  }
}

// ==========================
// INICIAR SERVIDOR
// ==========================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Yolanda activo en puerto ${PORT}`);
});
