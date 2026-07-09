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

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = '/tmp/videos';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

app.post('/upload-video', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const videoUrl = req.protocol + '://' + req.get('host') + '/video/' + req.file.filename;
  res.json({ url: videoUrl });
});

app.get('/video/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  res.sendFile(filePath);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('Miravo Server running on port ' + PORT));
