import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function test() {
  try {
    await pb.collection('_superusers').authWithPassword('admin@hostel.com', 'admin123456');
    const records = await pb.collection('payments').getFullList({ expand: 'resident' });
    console.log(JSON.stringify(records[0], null, 2));
  } catch (err) {}
}

test();
