import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function updateSchema() {
  try {
    console.log('Authenticating as admin...');
    await pb.collection('_superusers').authWithPassword('admin@hostel.com', 'admin123456');

    // 1. Make rooms viewable by public
    console.log('Updating rooms viewRule...');
    const roomsCollection = await pb.collections.getOne('rooms');
    roomsCollection.viewRule = "";
    await pb.collections.update('rooms', roomsCollection);
    console.log('Rooms viewRule updated to public.');

    // 2. Update maintenance_requests collection
    console.log('Updating maintenance_requests collection...');
    const mainCollection = await pb.collections.getOne('maintenance_requests');
    
    // Allow public creation
    mainCollection.createRule = "";
    
    await pb.collections.update('maintenance_requests', mainCollection);
    console.log('maintenance_requests updated successfully.');

  } catch (error) {
    console.error('Error updating schema:', error.data || error.message);
  }
}

updateSchema();
