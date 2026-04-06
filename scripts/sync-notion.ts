import * as path from 'path';
import dotenv from 'dotenv';
import { runNotionSync } from '../lib/run-notion-sync';

const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

runNotionSync().catch((error) => {
  console.error('❌ Sync failed:', error);
  process.exit(1);
});
