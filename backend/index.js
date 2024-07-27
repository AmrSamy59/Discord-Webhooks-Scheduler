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



app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  setInterval(async () => { // not buying your cron jobs subscription vercel
      try {
        const now = new Date();
    
        const result = await pool.query('SELECT * FROM webhooks WHERE time <= $1', [now]);
        console.log('result', result.rows);
    
        result.rows.forEach(async (webhook) => {
          try {
            await axios.post(webhook.webhook_url, webhook.message);
            await pool.query('DELETE FROM webhooks WHERE id = $1', [webhook.id]);
            console.log(`Webhook sent and removed: ${webhook.id}`);
          } catch (err) {
            console.error(`Failed to send webhook: ${webhook.id}`, err.message);
          }
        });
      } catch (err) {
        console.error('Error fetching scheduled webhooks', err.message);
      }
    }
  , 60*1000);
});
