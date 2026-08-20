import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function fixRequired() {
  try {
    await pb.collection('_superusers').authWithPassword('admin@hostel.com', 'admin123456');

    const collections = await pb.collections.getFullList();
    for (const collection of collections) {
      if (collection.type === 'base') {
        let modified = false;
        collection.fields = collection.fields.map(f => {
          if (f.type === 'number' && f.required) {
            f.required = false;
            modified = true;
          }
          return f;
        });
        if (modified) {
          await pb.collections.update(collection.id, collection);
          console.log(`Updated required constraint for ${collection.name}`);
        }
      }
    }
  } catch (error) {
    console.error('Error fixing schema:', error.data || error);
  }
}

fixRequired();
