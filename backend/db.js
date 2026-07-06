const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT || 5432),
  database: process.env.POSTGRES_DB || 'staffcar',
  user: process.env.POSTGRES_USER || 'staffcar_user',
  password: process.env.POSTGRES_PASSWORD || 'staffcar_password',
});

async function query(text, params) {
  return pool.query(text, params);
}

async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS cars (
      id SERIAL PRIMARY KEY,
      plate_no VARCHAR(32) NOT NULL UNIQUE,
      type VARCHAR(32) NOT NULL CHECK (type IN ('รถยนต์', 'รถจักรยานยนต์')),
      brand_model VARCHAR(120) NOT NULL,
      color VARCHAR(60) NOT NULL,
      owner VARCHAR(120) NOT NULL,
      department VARCHAR(120) NOT NULL,
      status VARCHAR(32) NOT NULL CHECK (status IN ('ออกแล้ว', 'รอออก', 'หมดอายุ')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

module.exports = {
  query,
  initDb,
  pool,
};
