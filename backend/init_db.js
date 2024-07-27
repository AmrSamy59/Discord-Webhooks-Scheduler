const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

pool.connect(async (err, client, release) => {
  if (err) {
    console.error('Database connection error', err.stack);
  } else {
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS webhooks (
          id SERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL,
          time TIMESTAMPTZ NOT NULL,
          webhook_url TEXT NOT NULL,
          message JSONB NOT NULL
        );
      `);
      console.log('Database initialized');
    } catch (err) {
      console.error('Error creating table', err.message);
    } finally {
      release();
      pool.end();
    }
  }
});
