const { Pool } = require('pg');
const axios = require('axios');

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
  
export default async function handler(req, res) {
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