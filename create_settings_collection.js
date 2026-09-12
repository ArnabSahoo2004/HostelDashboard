import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function createSettingsCollection() {
  try {
    console.log('Authenticating as admin...');
    await pb.collection('_superusers').authWithPassword('admin@hostel.com', 'admin123456');

    console.log('Creating settings collection...');
    const collectionData = {
      name: 'settings',
      type: 'base',
      system: false,
      schema: [
        { name: 'hostelName', type: 'text', required: true, options: { min: null, max: null, pattern: '' } },
        { name: 'tagline', type: 'text', required: false, options: { min: null, max: null, pattern: '' } },
        { name: 'address', type: 'text', required: false, options: { min: null, max: null, pattern: '' } },
        { name: 'phone', type: 'text', required: false, options: { min: null, max: null, pattern: '' } },
        { name: 'email', type: 'email', required: false, options: { exceptDomains: null, onlyDomains: null } },
        { name: 'rentDueDate', type: 'text', required: false, options: { min: null, max: null, pattern: '' } },
        { name: 'lateFeeAmount', type: 'text', required: false, options: { min: null, max: null, pattern: '' } },
        { name: 'whatsappApiKey', type: 'text', required: false, options: { min: null, max: null, pattern: '' } },
        { name: 'adminEmail', type: 'email', required: false, options: { exceptDomains: null, onlyDomains: null } },
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

createSettingsCollection();
