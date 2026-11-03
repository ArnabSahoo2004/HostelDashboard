import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function fixSchema3() {
  try {
    await pb.collection('_superusers').authWithPassword('admin@hostel.com', 'admin123456');
    console.log('Logged in as superuser');

    const collections = await pb.collections.getFullList();
    const roomsId = collections.find(c => c.name === 'rooms').id;
    const mrCollection = collections.find(c => c.name === 'maintenance_requests');

    if (mrCollection) {
      console.log(`Updating ${mrCollection.name}...`);
      
      const newFields = [
        { name: 'roomId', type: 'relation', required: true, collectionId: roomsId, maxSelect: 1, cascadeDelete: true },
        { name: 'description', type: 'text', required: true },
        { name: 'status', type: 'text', required: true }, // 'open' | 'in_progress' | 'resolved'
        { name: 'reportedDate', type: 'date', required: true },
        { name: 'resolvedDate', type: 'date', required: false }
      ].map(f => {
        return {
          ...f,
          id: 'field_' + Math.random().toString(36).substring(2, 8)
        };
      });
      
      const idField = mrCollection.fields.find(f => f.name === 'id');
      const createdField = mrCollection.fields.find(f => f.name === 'created');
      const updatedField = mrCollection.fields.find(f => f.name === 'updated');
      const baseFields = [idField, createdField, updatedField].filter(Boolean);
      
      mrCollection.fields = [...baseFields, ...newFields];

      await pb.collections.update(mrCollection.id, mrCollection);
      console.log(`Successfully updated ${mrCollection.name}`);
    }
  } catch (error) {
    console.error('Error fixing schema:', JSON.stringify(error.data || error, null, 2));
  }
}

fixSchema3();
