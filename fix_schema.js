import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function fixSchema() {
  try {
    await pb.collection('_superusers').authWithPassword('admin@hostel.com', 'admin123456');
    console.log('Logged in as superuser');

    const collections = await pb.collections.getFullList();

    const getCollectionId = (name) => {
      const c = collections.find(c => c.name === name);
      return c ? c.id : null;
    };

    const residentsId = getCollectionId('residents');
    const roomsId = getCollectionId('rooms');
    const bedsId = getCollectionId('beds');
    const bookingsId = getCollectionId('bookings');

    const fieldsMap = {
      'rooms': [
        { name: 'roomNumber', type: 'text', required: true },
        { name: 'floor', type: 'number', required: false },
        { name: 'capacity', type: 'number', required: true },
        { name: 'type', type: 'select', required: true, maxSelect: 1, values: ['ac', 'non-ac'] },
        { name: 'baseRent', type: 'number', required: true },
        { name: 'hostel', type: 'text', required: true }
      ],
      'beds': [
        { name: 'room', type: 'relation', required: true, collectionId: roomsId, maxSelect: 1, cascadeDelete: true },
        { name: 'bedLabel', type: 'text', required: true },
        { name: 'status', type: 'select', required: true, maxSelect: 1, values: ['available', 'occupied', 'maintenance'] }
      ],
      'residents': [
        { name: 'fullName', type: 'text', required: true },
        { name: 'email', type: 'text', required: false },
        { name: 'phone', type: 'text', required: false },
        { name: 'adharNumber', type: 'text', required: false },
        { name: 'address', type: 'text', required: false },
        { name: 'emergencyContact', type: 'text', required: false },
        { name: 'status', type: 'select', required: true, maxSelect: 1, values: ['active', 'inactive'] }
      ],
      'bookings': [
        { name: 'resident', type: 'relation', required: true, collectionId: residentsId, maxSelect: 1, cascadeDelete: true },
        { name: 'bed', type: 'relation', required: true, collectionId: bedsId, maxSelect: 1, cascadeDelete: true },
        { name: 'checkInDate', type: 'date', required: true },
        { name: 'checkOutDate', type: 'date', required: false },
        { name: 'rentAmount', type: 'number', required: true },
        { name: 'depositAmount', type: 'number', required: true }
      ],
      'payments': [
        { name: 'resident', type: 'relation', required: true, collectionId: residentsId, maxSelect: 1, cascadeDelete: true },
        { name: 'booking', type: 'relation', required: false, collectionId: bookingsId, maxSelect: 1, cascadeDelete: true },
        { name: 'amount', type: 'number', required: true },
        { name: 'monthFor', type: 'date', required: true },
        { name: 'dueDate', type: 'date', required: true },
        { name: 'status', type: 'select', required: true, maxSelect: 1, values: ['paid', 'unpaid', 'overdue', 'pending'] },
        { name: 'paidDate', type: 'date', required: false }
      ],
      'entry_logs': [
        { name: 'resident', type: 'relation', required: true, collectionId: residentsId, maxSelect: 1, cascadeDelete: true },
        { name: 'timestamp', type: 'date', required: true },
        { name: 'type', type: 'select', required: true, maxSelect: 1, values: ['Entry', 'Exit'] },
        { name: 'method', type: 'select', required: false, maxSelect: 1, values: ['Face', 'Fingerprint', 'Card', 'Manual'] }
      ]
    };

    for (const collection of collections) {
      if (fieldsMap[collection.name]) {
        console.log(`Updating ${collection.name}...`);
        
        const existingFields = collection.fields || [];
        const idField = existingFields.find(f => f.name === 'id');
        
        const newFields = fieldsMap[collection.name].map(f => {
          return {
            ...f,
            id: 'field_' + Math.random().toString(36).substring(2, 8)
          };
        });
        
        collection.fields = idField ? [idField, ...newFields] : newFields;

        await pb.collections.update(collection.id, collection);
        console.log(`Successfully updated ${collection.name}`);
      }
    }
  } catch (error) {
    console.error('Error fixing schema:', JSON.stringify(error.data || error, null, 2));
  }
}

fixSchema();
