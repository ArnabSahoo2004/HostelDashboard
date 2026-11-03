import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function updateSchema() {
  try {
    console.log('Authenticating as admin...');
    await pb.admins.authWithPassword('admin@hostel.com', 'admin123456'); // For v0.20+ this might be pb.admins or pb.collection('_superusers') depending on version. Let's try both.
    
    console.log('Fetching residents collection...');
    const collection = await pb.collections.getOne('residents');
    
    // Add new fields
    const newFields = [
      { name: 'fatherName', type: 'text', required: false },
      { name: 'fatherPhone', type: 'text', required: false },
      { name: 'motherName', type: 'text', required: false },
      { name: 'motherPhone', type: 'text', required: false },
      { name: 'localGuardianName', type: 'text', required: false },
      { name: 'localGuardianPhone', type: 'text', required: false },
      { name: 'localGuardianRelation', type: 'text', required: false },
      { name: 'occupation', type: 'text', required: false }
    ];

    for (const field of newFields) {
      if (!collection.fields.find(f => f.name === field.name)) {
        collection.fields.push(field);
      }
    }

    console.log('Updating residents collection...');
    await pb.collections.update('residents', collection);
    console.log('Successfully updated schema!');
  } catch (err) {
    if (err.status === 404) {
       // fallback for v0.23+ where admins is deprecated
       try {
         await pb.collection('_superusers').authWithPassword('admin@hostel.com', 'admin123456');
         const collection = await pb.collections.getOne('residents');
         
         const newFields = [
           { name: 'fatherName', type: 'text', required: false },
           { name: 'fatherPhone', type: 'text', required: false },
           { name: 'motherName', type: 'text', required: false },
           { name: 'motherPhone', type: 'text', required: false },
           { name: 'localGuardianName', type: 'text', required: false },
           { name: 'localGuardianPhone', type: 'text', required: false },
           { name: 'localGuardianRelation', type: 'text', required: false },
           { name: 'occupation', type: 'select', required: false, options: { maxSelect: 1, values: ['Student', 'Working Professional', 'Other'] } }
         ];

         for (const field of newFields) {
           if (!collection.schema.find(f => f.name === field.name)) {
             collection.schema.push(field);
           }
         }

         console.log('Updating residents collection...');
         await pb.collections.update('residents', collection);
         console.log('Successfully updated schema!');
       } catch (e2) {
           console.error("Failed with _superusers as well:", e2.data || e2);
       }
    } else {
        console.error("Error updating schema:", err.data || err);
    }
  }
}

updateSchema();
