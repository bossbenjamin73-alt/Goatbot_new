const axios = require("axios");

// Fonction pour envoyer un message à Messenger
function callSendAPI(senderId, message) {
  const request = require("request");
  request({
    uri: "https://graph.facebook.com/v16.0/me/messages",
    qs: { access_token: process.env.PAGE_TOKEN },
    method: "POST",
    json: { recipient: { id: senderId }, message: { text: message } }
  }, (err, res, body) => {
    if (err) console.error("Erreur API :", err);
    else console.log("Message envoyé :", body);
  });
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

    return res.data?.text || "Je n'ai pas pu générer de réponse.";
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
