import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function createEntryLogsCollection() {
  try {
    console.log('Authenticating as admin...');
    await pb.collection('_superusers').authWithPassword('admin@hostel.com', 'admin123456');

    console.log('Creating entry_logs collection...');
    const collectionData = {
      name: 'entry_logs',
      type: 'base',
      system: false,
      schema: [
        {
          name: 'resident',
          type: 'relation',
          required: true,
          options: {
            collectionId: (await pb.collections.getFirstListItem(`name='residents'`)).id,
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: null
          }
        },
        {
          name: 'timestamp',
          type: 'date',
          required: true,
          options: {
            min: '',
            max: ''
          }
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          options: {
            maxSelect: 1,
            values: ['Entry', 'Exit']
          }
        },
        {
          name: 'method',
          type: 'select',
          required: false,
          options: {
            maxSelect: 1,
            values: ['Face', 'Fingerprint', 'Card', 'Manual']
          }
        }
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: ''
    };

    const newCollection = await pb.collections.create(collectionData);
    console.log('Successfully created entry_logs collection:', newCollection.id);
  } catch (error) {
    console.error('Error creating entry_logs collection:', error.data || error.message);
  }
}

createEntryLogsCollection();
