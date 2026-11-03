import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function recreateSettingsCollection() {
  try {
    console.log('Authenticating as admin...');
    await pb.collection('_superusers').authWithPassword('admin@hostel.com', 'admin123456');

    try {
      console.log('Deleting existing settings collection...');
      const existing = await pb.collections.getOne('settings');
      await pb.collections.delete(existing.id);
    } catch (e) {
      console.log('Settings collection does not exist or already deleted.');
    }

    console.log('Creating settings collection with correct fields array...');
    const collectionData = {
      name: 'settings',
      type: 'base',
      system: false,
      fields: [
        { name: 'hostelName', type: 'text', required: false },
        { name: 'tagline', type: 'text', required: false },
        { name: 'address', type: 'text', required: false },
        { name: 'phone', type: 'text', required: false },
        { name: 'email', type: 'email', required: false },
        { name: 'rentDueDate', type: 'text', required: false },
        { name: 'lateFeeAmount', type: 'text', required: false },
        { name: 'whatsappApiKey', type: 'text', required: false },
        { name: 'adminEmail', type: 'email', required: false },
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: ''
    };

    const newCollection = await pb.collections.create(collectionData);
    console.log('Successfully created settings collection:', newCollection.id);

    // Initialize with default settings
    await pb.collection('settings').create({
      hostelName: "Satabdi Girls' Hostel",
      tagline: "Under The Orissa Sai Charitable Trust",
      address: "229, Saheed Nagar, Bhubaneswar - 751007",
      phone: "0674-2543234",
      email: "saikutira30@gmail.com",
      rentDueDate: "5",
      lateFeeAmount: "50",
      whatsappApiKey: "wa_live_xxxxxxxxxxxxx",
      adminEmail: "admin@hostel.com",
    });
    console.log('Initialized default settings row.');

  } catch (error) {
    console.error('Error creating settings collection:', error.data || error.message);
  }
}

recreateSettingsCollection();
