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
        // 1. Update payments collection to add paymentType
        console.log('Fetching payments collection...');
        const paymentsColl = await pb.collections.getOne('payments');
        
        const paymentTypeField = {
          name: 'paymentType',
          type: 'text',
          required: false
        };
        
        // Check if paymentType already exists
        if (!paymentsColl.fields.find(f => f.name === 'paymentType')) {
          paymentsColl.fields.push(paymentTypeField);
          await pb.collections.update('payments', paymentsColl);
          console.log('Added paymentType field to payments collection.');
        } else {
          console.log('paymentType field already exists in payments.');
        }

        // 2. Create electricity_bills collection
        console.log('Checking for electricity_bills collection...');
        try {
          await pb.collections.getOne('electricity_bills');
          console.log('electricity_bills collection already exists.');
        } catch (err) {
          if (err.status === 404) {
            console.log('Creating electricity_bills collection...');
            const roomsColl = await pb.collections.getOne('rooms');
            
            await pb.collections.create({
              name: 'electricity_bills',
              type: 'base',
              fields: [
                { name: 'room', type: 'relation', required: true, collectionId: roomsColl.id, cascadeDelete: true, maxSelect: 1 },
                { name: 'billingMonth', type: 'date', required: true },
                { name: 'totalAmount', type: 'number', required: true },
                { name: 'dueDate', type: 'date', required: true },
                { name: 'status', type: 'text', required: true }
              ],
              listRule: '',
              viewRule: '',
              createRule: '',
              updateRule: '',
              deleteRule: ''
            });
            console.log('Created electricity_bills collection.');
          } else {
            throw err;
          }
        }

        console.log('Successfully completed schema updates!');
    } catch (e) {
        console.error('Error in schema core:', e.response?.data || e);
    }
}

updateSchema();
