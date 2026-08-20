import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function updateSchema() {
  try {
    console.log('Authenticating as admin...');
    await pb.admins.authWithPassword('admin@hostel.com', 'admin123456');
    return updateSchemaCore();
  } catch (error) {
    if (error.status === 404 && error.url.includes('/api/admins/auth-with-password')) {
       // fallback for pb v0.23+ where admins is deprecated in favor of _superusers
       try {
         await pb.collection('_superusers').authWithPassword('admin@hostel.com', 'admin123456');
         console.log('Authenticated as superuser.');
         return updateSchemaCore();
       } catch (e) {
           console.error('Superuser auth failed:', e);
       }
    } else {
      console.error('Error authenticating:', error);
    }
  }
}

async function updateSchemaCore() {
    try {
        console.log('Fetching electricity_bills collection...');
        const coll = await pb.collections.getOne('electricity_bills');
        
        const newFields = [
          { name: 'previousReading', type: 'number', required: false },
          { name: 'currentReading', type: 'number', required: false },
          { name: 'ratePerUnit', type: 'number', required: false }
        ];
        
        let changed = false;
        for (const field of newFields) {
          if (!coll.fields.find(f => f.name === field.name)) {
            coll.fields.push(field);
            changed = true;
            console.log(`Added ${field.name}`);
          }
        }
        
        if (changed) {
            await pb.collections.update('electricity_bills', coll);
            console.log('Successfully updated electricity_bills schema.');
        } else {
            console.log('Fields already exist.');
        }

    } catch (e) {
        console.error('Error in schema core:', e.response?.data || e);
    }
}

updateSchema();
