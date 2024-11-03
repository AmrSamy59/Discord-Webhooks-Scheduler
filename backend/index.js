const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const axios = require('axios');
const { Pool } = require('pg');
const cors = require('cors');
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

app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes
app.use(fileUpload());

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

pool.connect((err) => {
  if (err) {
    console.error('Database connection error', err.stack);
  } else {
    console.log('Database connected');
  }
});


app.post('/upload', (req, res) => {
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
app.post('/schedule', async (req, res) => {
    const { user_id, time, webhook_url, message, fileUrl } = req.body;
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
  app.delete('/schedule/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM webhooks WHERE id = $1', [id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Fetch scheduled webhooks for a user
  app.get('/schedule/:user_id', async (req, res) => {
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

  app.get('/test_sched/:sched_id', async (req, res) => {
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
        `DELETE FROM webhooks WHERE id=${sched_id} RETURNING id, webhook_url, message, file_url`,
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
            const fileName = webhook.file_url.split('/').pop(); // Extract the file name from the URL

            // Append the file to formData
            formData.append('file[0]', Buffer.from(response.data), fileName);
          } 

          await axios.post(webhook.webhook_url, formData, {
            headers: formData.getHeaders(),
          });
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
  

  app.post('/check_webhooks', async (req, res) => {
    const key = req.headers['x-api-key'];
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
            const fileName = webhook.file_url.split('/').pop(); // Extract the file name from the URL

            // Append the file to formData
            formData.append('file[0]', Buffer.from(response.data), fileName);
          } 

          await axios.post(webhook.webhook_url, formData, {
            headers: formData.getHeaders(),
          });
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
  


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
