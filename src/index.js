const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// 🔐 Variables d'environnement
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const HF_API_KEY = process.env.HF_API_KEY;

// ✅ Route test (important pour éviter page vide)
app.get("/", (req, res) => {
  res.send("GOATBOT est actif 🚀");
});

// ✅ Vérification webhook Facebook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    console.log("Webhook vérifié ✅");
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

// ✅ Réception des messages Messenger
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;

    if (body.object === "page") {
      for (const entry of body.entry) {
        for (const event of entry.messaging) {
          const sender_psid = event.sender.id;

          if (event.message && event.message.text) {
            const userMessage = event.message.text.toLowerCase();
            let botMessage = "";

            // 🔥 Réponse personnalisée
            if (
              userMessage.includes("qui t'a créé") ||
              userMessage.includes("qui ta créé")
            ) {
              botMessage = "Mon créateur s'appelle Benjamin Créator 💫🔥";
            } else {
              // 🤖 Réponse IA Hugging Face
              try {
                const response = await axios.post(
                  "https://api-inference.huggingface.co/models/gpt2",
                  { inputs: userMessage },
                  {
                    headers: {
                      Authorization: `Bearer ${HF_API_KEY}`,
                    },
                  }
                );

                botMessage =
                  response.data?.[0]?.generated_text ||
                  "Je réfléchis encore 🤖...";
              } catch (error) {
                console.error("Erreur HF :", error.message);
                botMessage = "Désolé 😓, je n'ai pas pu répondre.";
              }
            }

            // 📤 Envoi vers Messenger
            await axios.post(
              `https://graph.facebook.com/v17.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
              {
                recipient: { id: sender_psid },
                message: { text: botMessage },
              }
            );
          }
        }
      }

      res.status(200).send("EVENT_RECEIVED");
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error("Erreur serveur :", error.message);
    res.sendStatus(500);
  }
});

// 🚀 Lancement serveur
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Serveur GOATBOT actif sur le port ${PORT} 🚀`);
});
