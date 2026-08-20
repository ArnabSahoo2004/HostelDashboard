import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function fixMealOptOuts() {
  try {
    console.log('Authenticating as admin...');
    await pb.collection('_superusers').authWithPassword('admin@hostel.com', 'admin123456');

    const collection = await pb.collections.getOne('meal_opt_outs');
    const residentsColl = await pb.collections.getFirstListItem(`name='residents'`);
    
    collection.fields.push(
      {
        name: 'resident',
        type: 'relation',
        required: true,
        collectionId: residentsColl.id,
        cascadeDelete: true,
        maxSelect: 1
      },
      {
        name: 'date',
        type: 'date',
        required: true
      },
      {
        name: 'mealType',
        type: 'select',
        required: true,
        maxSelect: 1,
        values: ['lunch', 'dinner']
      }
    );

    await pb.collections.update(collection.id, collection);
    console.log('Successfully added fields to meal_opt_outs');
  } catch (error) {
    if (error.response) {
       console.error('Error fixing meal_opt_outs:', JSON.stringify(error.response, null, 2));
    } else {
       console.error('Error fixing meal_opt_outs:', error.message);
    }
  }
}

fixMealOptOuts();
