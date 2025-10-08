import { pool } from './db';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runReferralMigration() {
  try {
    const sql = await fs.readFile(
      path.join(__dirname, 'migrations', 'add-referral-columns.sql'),
      'utf-8'
    );
    
    await pool.query(sql);
    console.log('✅ Referral system columns added successfully');
  } catch (error: any) {
    // Ignore if columns already exist
    if (error.code === '42701') {
      console.log('ℹ️  Referral columns already exist');
    } else {
      console.error('❌ Error running referral migration:', error.message);
    }
  }
}
