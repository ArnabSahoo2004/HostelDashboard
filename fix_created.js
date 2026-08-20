import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function fixCreated() {
  try {
    await pb.collection('_superusers').authWithPassword('admin@hostel.com', 'admin123456');

    const collections = await pb.collections.getFullList();

    for (const collection of collections) {
      if (collection.type === 'base') {
        const hasCreated = collection.fields.some(f => f.name === 'created');
        const hasUpdated = collection.fields.some(f => f.name === 'updated');
        
        let modified = false;
        if (!hasCreated) {
          collection.fields.push({
            name: 'created',
            type: 'autodate',
            onCreate: true,
            onUpdate: false,
            hidden: false,
            system: false
          });
          modified = true;
        }
        
        if (!hasUpdated) {
          collection.fields.push({
            name: 'updated',
            type: 'autodate',
            onCreate: true,
            onUpdate: true,
            hidden: false,
            system: false
          });
          modified = true;
        }

        if (modified) {
          await pb.collections.update(collection.id, collection);
          console.log(`Added created/updated to ${collection.name}`);
        }
      }
    }
  } catch (error) {
    console.error('Error fixing schema:', error.data || error);
  }
}

fixCreated();
