const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const axios = require('axios');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

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

// Routes will go here
// Schedule a new webhook
app.post('/schedule', async (req, res) => {
    const { user_id, time, webhook_url, message } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO webhooks (user_id, time, webhook_url, message) VALUES ($1, $2, $3, $4) RETURNING *',
        [user_id, time, webhook_url, message]
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
        'DELETE FROM webhooks WHERE time <= $1 RETURNING id, webhook_url, message',
        [now]
      );
  
      console.log('Fetched and deleted webhooks:', webhooks);
  
      // Process webhooks concurrently
      await Promise.all(webhooks.map(async (webhook) => {
        try {
          await axios.post(webhook.webhook_url, webhook.message);
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
