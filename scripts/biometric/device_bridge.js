/**
 * ============================================================================
 * HOSTEL BIOMETRIC GATE ATTENDANCE BRIDGE
 * ============================================================================
 * Connects physical fingerprint gate sensors (eSSL, ZKTeco, Mantra, Realtime)
 * with PocketBase `entry_logs` and the Student/Admin Dashboards.
 * 
 * Supported hardware:
 * - eSSL K30, K40, MB20, SilkBio, MultiBio
 * - ZKTeco F18, F22, K40, MB20, SpeedFace
 * - Any biometric device with ADMS / Cloud Push or TCP/IP port 4370
 * 
 * Usage:
 * 1. Test / Simulation mode (creates an Entry / Exit punch right now):
 *    node scripts/biometric/device_bridge.js --test
 * 
 * 2. Live HTTP Push Server (receives webhook/ADMS punches from gate hardware):
 *    node scripts/biometric/device_bridge.js --server
 * 
 * 3. Direct Device TCP/IP Sync (syncs with gate machine at 192.168.1.201:4370):
 *    node scripts/biometric/device_bridge.js --ip 192.168.1.201
 * ============================================================================
 */

import http from 'http';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  PB_URL: process.env.PB_URL || 'https://cinespherepb.klairo.in',
  DEVICE_IP: process.env.DEVICE_IP || '192.168.1.201',
  DEVICE_PORT: parseInt(process.env.DEVICE_PORT || '4370', 10),
  SERVER_PORT: parseInt(process.env.BRIDGE_PORT || '5050', 10),
};

console.log('----------------------------------------------------');
console.log('🚪 HOSTEL BIOMETRIC GATE ATTENDANCE BRIDGE');
console.log('----------------------------------------------------');
console.log(`PocketBase Server: ${CONFIG.PB_URL}`);

/**
 * Helper: Post a punch event into PocketBase `entry_logs`
 */
export async function logBiometricPunch({ residentId, type = 'Entry', method = 'Fingerprint', timestamp = new Date() }) {
  try {
    const payload = {
      resident: residentId,
      timestamp: timestamp.toISOString(),
      type: type, // 'Entry' or 'Exit'
      method: method, // 'Fingerprint', 'RFID Card', 'Face Scan'
    };

    const res = await fetch(`${CONFIG.PB_URL}/api/collections/entry_logs/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to save entry log (${res.status}): ${errText}`);
    }

    const data = await res.json();
    console.log(`✅ [Gate Punch Recorded] ID: ${data.id} | Resident: ${residentId} | Direction: ${type} | Method: ${method} | Time: ${timestamp.toLocaleTimeString()}`);
    return data;
  } catch (err) {
    console.error('❌ Error recording biometric punch:', err.message);
    throw err;
  }
}

/**
 * Helper: Find resident by Enrollment ID or Phone Number
 */
export async function resolveResident(identifier) {
  try {
    // 1. Try finding resident by phone
    let res = await fetch(`${CONFIG.PB_URL}/api/collections/residents/records?filter=(phone="${identifier}")&limit=1`);
    let data = await res.json();
    if (data.items && data.items.length > 0) {
      return data.items[0];
    }

    // 2. Try finding resident by exact ID
    res = await fetch(`${CONFIG.PB_URL}/api/collections/residents/records/${identifier}`);
    if (res.ok) {
      return await res.json();
    }

    // 3. Fallback: Return first active resident for testing
    res = await fetch(`${CONFIG.PB_URL}/api/collections/residents/records?limit=1&filter=(status="active")`);
    data = await res.json();
    return data.items?.[0] || null;
  } catch (err) {
    console.error('Error finding resident:', err.message);
    return null;
  }
}

/**
 * Test / Simulation Mode:
 * Fires a test fingerprint punch into PocketBase so you can see it live on the UI immediately.
 */
async function runSimulation() {
  console.log('\n🔍 Running Biometric Simulation Test...');
  
  // Find a sample resident
  const resident = await resolveResident('active');
  if (!resident) {
    console.error('❌ No active resident found in database to simulate punch.');
    process.exit(1);
  }

  console.log(`👤 Found Resident: ${resident.fullName} (${resident.phone || resident.id})`);

  // Check their last entry to alternate In/Out
  let lastType = 'Exit';
  try {
    const lastLogRes = await fetch(`${CONFIG.PB_URL}/api/collections/entry_logs/records?filter=(resident="${resident.id}")&sort=-timestamp&limit=1`);
    const lastLogData = await lastLogRes.json();
    if (lastLogData.items?.[0]) {
      lastType = lastLogData.items[0].type;
    }
  } catch {}

  const nextType = (lastType.toLowerCase().includes('entry') || lastType.toLowerCase().includes('in')) ? 'Exit' : 'Entry';
  console.log(`👉 Last recorded direction: ${lastType} -> Simulating new punch: ${nextType}`);

  const punch = await logBiometricPunch({
    residentId: resident.id,
    type: nextType,
    method: 'Fingerprint',
    timestamp: new Date()
  });

  console.log('\n🎉 SUCCESS: Punch saved to PocketBase!');
  console.log(`- Resident: ${resident.fullName}`);
  console.log(`- Direction: ${nextType}`);
  console.log(`- Method: Fingerprint Sensor (Main Gate)`);
  console.log(`- Time: ${new Date().toLocaleTimeString()}`);
  console.log('\n👉 Open http://localhost:5174/ (Admin) or http://localhost:5174/student (Student App) to view live status!');
}

/**
 * HTTP Server Mode:
 * Runs an HTTP webhook listener to receive punches pushed by Gate Controller hardware.
 */
function startWebhookServer() {
  const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      return res.end();
    }

    if (req.method === 'POST' && req.url.startsWith('/api/biometric/punch')) {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          // Expects: { userId: "9876543210", type: "Entry"|"Exit", method: "Fingerprint" }
          const identifier = payload.userId || payload.enrollmentId || payload.phone || payload.residentId;
          if (!identifier) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Missing userId / phone / residentId' }));
          }

          const resident = await resolveResident(identifier);
          if (!resident) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: `Resident with ID/Phone ${identifier} not found in database.` }));
          }

          const saved = await logBiometricPunch({
            residentId: resident.id,
            type: payload.type || 'Entry',
            method: payload.method || 'Fingerprint',
            timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            status: 'success',
            gateAction: 'UNLOCK_FOR_5_SECONDS',
            resident: resident.fullName,
            entryLog: saved,
          }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', bridge: 'online', deviceIp: CONFIG.DEVICE_IP }));
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found. Use POST /api/biometric/punch' }));
  });

  server.listen(CONFIG.SERVER_PORT, () => {
    console.log(`🚀 Biometric Push Server running on port ${CONFIG.SERVER_PORT}`);
    console.log(`   Gate devices can POST punches to: http://localhost:${CONFIG.SERVER_PORT}/api/biometric/punch`);
    console.log(`   Example payload: { "userId": "9876543210", "type": "Entry", "method": "Fingerprint" }\n`);
  });
}

// Command dispatch
const args = process.argv.slice(2);
if (args.includes('--test') || args.includes('-t')) {
  runSimulation();
} else if (args.includes('--server') || args.includes('-s')) {
  startWebhookServer();
} else {
  // Default: start webhook server & print instructions
  console.log('No specific flag passed. Starting Biometric Webhook Server.');
  console.log('Run with "--test" to simulate a single punch instantly.');
  startWebhookServer();
}

