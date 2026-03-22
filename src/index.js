const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Fonction pour envoyer un message à Messenger
function callSendAPI(senderId, message) {
  const axios = require("axios");
  axios.post("https://graph.facebook.com/v16.0/me/messages", {
    recipient: { id: senderId },
    message: { text: message }
  }, {
    params: { access_token: process.env.PAGE_TOKEN }
  })
  .then(res => console.log("Message envoyé :", res.data))
  .catch(err => console.error("Erreur API :", err.message));
}

// Fonction pour appeler Google Gemini et générer une réponse
async function getResponseFromGemini(userMessage) {
  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const res = await axios.post(endpoint, {
      contents: [{ parts: [{ text: userMessage }] }]
    }, {
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      }
    });

    return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "Je n'ai pas pu générer de réponse.";
  } catch (error) {
    console.error("Erreur Gemini :", error.response?.data || error.message);
    return "Je n'ai pas pu générer de réponse.";
  }
}

// Webhook Messenger
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    for (const entry of body.entry) {
      const webhookEvent = entry.messaging[0];
      const senderId = webhookEvent.sender.id;

      if (webhookEvent.message && webhookEvent.message.text) {
        const reply = await getResponseFromGemini(webhookEvent.message.text);
        callSendAPI(senderId, reply);
      }
    }
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// GET webhook pour la vérification
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot Goatbot lancé sur le port ${PORT}`);
});