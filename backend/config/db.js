const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const dbConfig = {
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  password: process.env.PGPASSWORD || 'postgres',
  port: process.env.PGPORT || 5432,
};
const TARGET_DB = process.env.PGDATABASE || 'healthcare_crm';

let pool = new Pool({ ...dbConfig, database: TARGET_DB });

async function seedUsers(client) {
  try {
    const usersToSeed = [
      { name: 'Admin User', email: 'ganeshboddeti05@gmail.com', password: 'Ganesh@8978', role: 'admin', account_id: 'ADMIN001' }
    ];

    for (const u of usersToSeed) {
      const check = await client.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [u.email]);
      if (check.rowCount === 0) {
        const hash = await bcrypt.hash(u.password, 10);
        if (u.role === 'admin') {
          await client.query(
            `INSERT INTO users (name, email, password_hash, role, account_id) VALUES ($1, $2, $3, $4, $5)`,
            [u.name, u.email, hash, u.role, u.account_id]
          );
        } else {
          await client.query(
            `INSERT INTO users (name, email, password_hash, role, group_name, account_id) VALUES ($1, $2, $3, $4, $5, $6)`,
            [u.name, u.email, hash, u.role, u.group_name, u.account_id]
          );
        }
        console.log(`[Seed] Created user: ${u.email} (${u.password})`);
      }
    }
  } catch (err) {
    console.error('Error seeding database:', err.message);
  }
}

async function initDB() {
  try {
    const tempPool = new Pool({ ...dbConfig, database: 'postgres' });
    const checkDb = await tempPool.query(`SELECT 1 FROM pg_database WHERE datname='${TARGET_DB}'`);
    if (checkDb.rowCount === 0) {
      await tempPool.query(`CREATE DATABASE ${TARGET_DB}`);
      console.log("Database created successfully");
    }
    await tempPool.end();

    pool = new Pool({ ...dbConfig, database: TARGET_DB });
    const client = await pool.connect();
    console.log("Database connected successfully");

    const initSQL = fs.readFileSync(path.join(__dirname, '..', 'init.sql')).toString();
    await client.query(initSQL);
    console.log("Tables initialized successfully");

    // Optional Reset Mechanism
    if (process.env.RESET_DB_USERS === 'true') {
      console.log("[DB] Resetting users table as requested...");
      await client.query('DELETE FROM users');
    }

    await seedUsers(client);

    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_attempts INTEGER DEFAULT 0");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20)");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT TRUE");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE");
    await client.query("ALTER TABLE leads ADD COLUMN IF NOT EXISTS city VARCHAR(100)");
    await client.query("ALTER TABLE demos ADD COLUMN IF NOT EXISTS feedback TEXT");

    client.release();
  } catch (err) {
    console.error("Database connection failed. Check .env credentials");
    console.error("Database initialization error:", err);
  }
}

module.exports = {
  pool,
  initDB,
  getClient: async () => await pool.connect(),
  runTransaction: async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
};
