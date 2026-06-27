const express = require('express');
const admin = require('firebase-admin');

const serviceAccount = JSON.parse(Buffer.from(process.env.SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const app = express();
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'Miravo Server Running' }));

app.post('/send-notification', async (req, res) => {
  const { token, title, body, data } = req.body;
  try {
    await admin.messaging().send({
      token,
      notification: { title, body },
      data: data || {},
      android: { priority: 'high', notification: { sound: 'default', channelId: 'miravo_messages' } }
    });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/send-notification-multiple', async (req, res) => {
  const { tokens, title, body, data } = req.body;
  try {
    const msgs = tokens.map(t => ({
      token: t,
      notification: { title, body },
      data: data || {},
      android: { priority: 'high', notification: { sound: 'default', channelId: 'miravo_messages' } }
    }));
    const result = await admin.messaging().sendEach(msgs);
    res.json({ success: true, successCount: result.successCount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Miravo Server running on port ' + PORT));
