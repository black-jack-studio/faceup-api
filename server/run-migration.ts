import { pool } from './db';

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
      ADD COLUMN IF NOT EXISTS referred_by VARCHAR,
      ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS referral_reward_claimed BOOLEAN DEFAULT FALSE
    `);
    console.log('✅ Referral columns added successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

migrate();
