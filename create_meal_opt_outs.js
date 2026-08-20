import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function createMealOptOutsCollection() {
  try {
    console.log('Authenticating as admin...');
    await pb.collection('_superusers').authWithPassword('admin@hostel.com', 'admin123456');

    console.log('Creating meal_opt_outs collection...');
    const collectionData = {
      name: 'meal_opt_outs',
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
          name: 'date',
          type: 'date',
          required: true,
          options: {
            min: '',
            max: ''
          }
        },
        {
          name: 'mealType',
          type: 'select',
          required: true,
          options: {
            maxSelect: 1,
            values: ['lunch', 'dinner']
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
    console.log('Successfully created meal_opt_outs collection:', newCollection.id);
  } catch (error) {
    console.error('Error creating meal_opt_outs collection:', error.data || error.message);
  }
}

createMealOptOutsCollection();
