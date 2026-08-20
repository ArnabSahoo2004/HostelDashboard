import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function test() {
  try {
    await pb.collection('_superusers').authWithPassword('admin@hostel.com', 'admin123456');

    const mrCollection = await pb.collections.getOne('maintenance_requests');
    console.log('maintenance_requests schema:', JSON.stringify(mrCollection.fields, null, 2));
  } catch (err) {
    console.log('Error:', err.message);
  }
}

test();
