import PocketBase from 'pocketbase';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PB_URL = process.env.VITE_POCKETBASE_URL || 'https://cinespherepb.klairo.in';
const pb = new PocketBase(PB_URL);

async function syncSchema() {
  console.log(`Connecting to PocketBase at: ${PB_URL}`);
  try {
    await pb.collection('_superusers').authWithPassword('admin@hostel.com', 'admin123456');
    console.log('✓ Superuser authenticated successfully.');

    const schemaPath = path.resolve(__dirname, '../pb_schema.json');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    console.log(`✓ Loaded ${schema.length} collections from pb_schema.json`);

    console.log('Applying schema sync to PocketBase...');
    await pb.collections.import(schema, false);
    console.log('✓ Successfully synchronized schema with PocketBase!');
  } catch (err) {
    console.error('❌ Error updating PocketBase schema:', err.message);
    if (err.data) {
      console.error('Details:', JSON.stringify(err.data, null, 2));
    }
    process.exit(1);
  }
}

syncSchema();

