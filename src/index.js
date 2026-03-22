app.post("/webhook", (req, res) => {
  const body = req.body;
  if (body.object === "page") {
    body.entry.forEach(entry => {
      const webhookEvent = entry.messaging[0];
      const senderId = webhookEvent.sender.id;

      // Réponse simple automatique
      callSendAPI(senderId, "Salut ! Je suis ton Goatbot 😎");
    });
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

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
