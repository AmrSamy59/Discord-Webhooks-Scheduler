const { Pool } = require('pg');
require('dotenv').config();

const POOL_CONFIG = {
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
};

const RECONNECT_BASE_DELAY = 1000; // Starting delay in ms
const MAX_RECONNECT_ATTEMPTS = 5;

let pool = null;
let isReconnecting = false;

const createPool = () => {
  return new Pool(POOL_CONFIG);
};

// Initialize pool and attach handlers
const initializePool = () => {
  pool = createPool();
  attachErrorHandlers();
  console.log('Database pool initialized');
};

const attachErrorHandlers = () => {
  pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
    handleDisconnect();
  });

  pool.on('connect', () => {
    console.log('Successfully connected to database');
  });

  pool.on('remove', () => {
    console.log('Client removed from pool');
  });
};

const handleDisconnect = async () => {
  if (isReconnecting) return; // Prevent multiple simultaneous reconnects
  isReconnecting = true;

  console.error('Database connection lost. Attempting to reconnect...');
  
  try {
    await pool.end(); // Attempt graceful shutdown
  } catch (err) {
    console.error('Error closing old pool:', err);
  }

  let attempts = 0;
  while (attempts < MAX_RECONNECT_ATTEMPTS) {
    const delay = RECONNECT_BASE_DELAY * Math.pow(2, attempts); // Exponential backoff
    console.log(`Reconnect attempt (${attempts + 1}/${MAX_RECONNECT_ATTEMPTS}) in ${delay}ms...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    attempts++;

    try {
      pool = createPool();
      attachErrorHandlers();
      await pool.query('SELECT NOW()'); // Test connection
      console.log('Reconnection successful');
      isReconnecting = false;
      return;
    } catch (err) {
      console.error('Reconnection attempt failed:', err);
    }
  }

  console.error('Max reconnection attempts reached. Please check database availability.');
  isReconnecting = false;
};

// Ensure connection with retry logic
async function ensureConnection() {
  if (!pool) {
    initializePool();
  }

  try {
    await pool.query('SELECT NOW()');
  } catch (err) {
    console.error('Connection test failed:', err);
    await handleDisconnect();
    // After reconnection, test again
    try {
      await pool.query('SELECT NOW()');
    } catch (retryErr) {
      throw new Error('Failed to establish database connection after reconnect attempt');
    }
  }
}

// Query wrapper with connection assurance
async function query(text, params) {
  await ensureConnection();
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('Query failed:', err);
    await handleDisconnect(); // Attempt reconnect on query failure
    return pool.query(text, params); // Retry once after reconnect
  }
}

// Initialize the pool and create table
const initializeDatabase = async () => {
  initializePool();
  
  try {
    await ensureConnection();
    
    // Create table
    await query(`
      CREATE TABLE IF NOT EXISTS webhooks (
        id SERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        time TIMESTAMPTZ NOT NULL,
        webhook_url TEXT NOT NULL,
        message JSONB NOT NULL,
        file_url TEXT
      );
    `);
    console.log('Database initialized');
    
    // Note: Not ending pool here since we want it to stay active
    // pool.end() was removed from the original finally block
  } catch (err) {
    console.error('Error initializing database:', err.message);
  }
};

// Periodic health check
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
setInterval(async () => {
  try {
    await ensureConnection();
  } catch (err) {
    console.error('Periodic health check failed:', err);
  }
}, HEALTH_CHECK_INTERVAL);

// Run initialization
initializeDatabase();

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down database pool...');
  if (pool) {
    await pool.end().catch(err => console.error('Error during pool shutdown:', err));
  }
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
d
// Export query function for potential use elsewhere
module.exports = { query };