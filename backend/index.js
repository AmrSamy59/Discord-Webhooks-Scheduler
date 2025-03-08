const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const axios = require('axios');
const cors = require('cors');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const pool = require('./db');

require('dotenv').config();

const fileUpload = require('express-fileupload');
const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

const app = express();
const port = 3000;

const CCORS = cors({ origin: process.env.APP_URL, credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'DELETE']
 });
app.use(CCORS);
app.options(process.env.APP_URL, CCORS); // Enable pre-flight
app.use(express.json({ limit: '25mb' }));
app.use(fileUpload({ limit: '25mb' }));

// routes with no authentication

// cron job to check for webhooks every minute on second 2
cron.schedule('2 * * * * *', async () => {
  const sentWebhooks = [];
  const failedWebhooks = [];
  
  try {
    const now = new Date();

    // Start transaction
    await pool.query('BEGIN');

    // Select and delete eligible webhooks in one query
    const { rows: webhooks } = await pool.query(
      'DELETE FROM webhooks WHERE time <= $1 RETURNING id, webhook_url, message, file_url',
      [now]
    );

    console.log('Fetched and deleted webhooks:', webhooks);

    // Process webhooks concurrently
    await Promise.all(webhooks.map(async (webhook) => {
      try {

        const formData = new FormData();
        formData.append('payload_json', JSON.stringify(webhook.message));

        if (webhook.file_url) {
          const response  = await axios.get(webhook.file_url, { responseType: 'arraybuffer' });
          let fileName = webhook.file_url.split('/api/').pop(); // Extract the file name from the URL
          // file name is in form: 1630000000000_file_name.ext
          // get the file name by splitting the string by '_' and removing the first element
          fileName = fileName.split('_').slice(1).join('_');

          const fileBlob = new Blob([response.data], { type: response.headers['content-type'] });

          // Append the file to formData
          formData.append('file[0]', fileBlob, fileName);
        } 

        const response = await fetch(webhook.webhook_url, {
          method: 'POST',
          body: formData,
      });
  
      if (!response.ok) {
          throw new Error('Failed to send webhook');
      }
      console.log(`Webhook sent successfully: ${webhook.id}`);
      sentWebhooks.push(webhook);
      } catch (err) {
        console.error(`Failed to send webhook: ${webhook.id}`, err.message);
        failedWebhooks.push(webhook);
      }
    }));

    // Commit transaction
    await pool.query('COMMIT');

    console.log('Webhooks sent:', sentWebhooks, 'Webhooks failed:', failedWebhooks);
  } catch (err) {
    console.error('Error processing webhooks', err.message, sentWebhooks, failedWebhooks);

    // Rollback transaction in case of error
    await pool.query('ROLLBACK');
  }
});






////////////// discord auth

const WHITELISTED_IDS = [
  '271026539007574018', // gat
  '132215959023779842', // kim
  '969506800808366110', // molly
  '1060679760428138546', // sam
  '638465624913477653', // brian
];



app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));
app.use(cookieParser());

app.get('/api/login', (req, res) => {
const authURL = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify`;
res.redirect(authURL);
});

app.get('/api/callback', async (req, res) => {
const { code } = req.query;

try {
  const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.REDIRECT_URI,
  }).toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const userResponse = await axios.get('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
  });

  const user = userResponse.data;

  if (WHITELISTED_IDS.includes(String(user.id))) {
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.SESSION_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, {
      httpOnly: true, // Secure cookie
      secure: true,  // Set to true in production (HTTPS only)
      sameSite: 'None', // Prevent CSRF issues
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    res.redirect(process.env.APP_URL);
  } else {
    res.status(403).send('You are not authorized.');
  }
} catch (error) {
  console.error(error);
  res.status(500).send('Authentication failed.');
}
});


// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).send('Not authenticated');

  jwt.verify(token, process.env.SESSION_SECRET, (err, decoded) => {
    if (err) return res.status(403).send('Invalid token');
    req.user = decoded;
    next();
  });
};

app.use(verifyToken);

// routes with authentication

app.post('/api/upload', (req, res) => {
  if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
  }

  const file = req.files.file; // `express-fileupload` parses this automatically
  const uploadParams = {
      Bucket: process.env.S3_BUCKET,
      Key: `${Date.now()}_${file.name}`,
      Body: file.data,
      ContentType: file.mimetype,
  };

  s3.upload(uploadParams, (err, data) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ fileUrl: data.Location }); // Send back the file URL
  });
});


// Schedule a new webhook
app.post('/api/schedule', async (req, res) => {
    const { time, webhook_url, message, fileUrl } = req.body;
    console.log(req.body)
    const user_id = req.user.id;
    try {
      const result = await pool.query(
        'INSERT INTO webhooks (user_id, time, webhook_url, message, file_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [user_id, time, webhook_url, message, fileUrl]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Remove a scheduled webhook
  app.delete('/api/schedule/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM webhooks WHERE id = $1', [id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Fetch scheduled webhooks for a user
  app.get('/api/schedule/:user_id', async (req, res) => {
    const { user_id } = req.params;
    try {
      const result = await pool.query('SELECT * FROM webhooks WHERE user_id = $1 ORDER BY time ASC', [user_id]);
      res.status(200).json(result.rows);
      console.log('got', result.rows);
    } catch (err) {
        console.log('err', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/test_sched/:sched_id', async (req, res) => {
    const { sched_id } = req.params;
    console.log('sched_id', sched_id);
    const key = 'gatkim123';
    if (key !== process.env.SECRET_KEY) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
  
    const sentWebhooks = [];
    const failedWebhooks = [];
    
    try {
      const now = new Date();
  
      // Start transaction
      await pool.query('BEGIN');
  
      // Select and delete eligible webhooks in one query
      const { rows: webhooks } = await pool.query(
        `DELETE FROM webhooks WHERE id=${sched_id} RETURNING id, webhook_url, message, file_url`
      );
  
      console.log('Fetched and deleted webhooks:', webhooks);
  
      // Process webhooks concurrently
      await Promise.all(webhooks.map(async (webhook) => {
        try {

          const formData = new FormData();
          formData.append('payload_json', JSON.stringify(webhook.message));

          if (webhook.file_url) {
            const response  = await axios.get(webhook.file_url, { responseType: 'arraybuffer' });
            let fileName = webhook.file_url.split('/api/').pop(); // Extract the file name from the URL
            // file name is in form: 1630000000000_file_name.ext
            // get the file name by splitting the string by '_' and removing the first element
            fileName = fileName.split('_').slice(1).join('_');

            const fileBlob = new Blob([response.data], { type: response.headers['content-type'] });

            // Append the file to formData
            formData.append('file[0]', fileBlob, fileName);
          } 

          const response = await fetch(webhook.webhook_url, {
            method: 'POST',
            body: formData,
        });
    
        if (!response.ok) {
            throw new Error('Failed to send webhook');
        }
        console.log(`Webhook sent successfully: ${webhook.id}`);
        sentWebhooks.push(webhook);
        } catch (err) {
          console.error(`Failed to send webhook: ${webhook.id}`, err.message);
          failedWebhooks.push(webhook);
        }
      }));
  
      // Commit transaction
      await pool.query('COMMIT');
  
      res.status(200).json({ sentWebhooks, failedWebhooks });
  
    } catch (err) {
      console.error('Error processing webhooks', err.message);
  
      // Rollback transaction in case of error
      await pool.query('ROLLBACK');
  
      res.status(500).json({ error: err.message, sentWebhooks, failedWebhooks });
    }
  });
  


app.get('/api/me', (req, res) => {
  res.json(req.user);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
