import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.VITE_PB_URL || 'https://cinespherepb.klairo.in');

async function addAgreementFields() {
  try {
    console.log('Authenticating as superuser...');
    await pb.collection('_superusers').authWithPassword('admin@hostel.com', 'admin123456');

    const resCol = await pb.collections.getOne('residents');

    const agreementFields = [
      { name: 'agreementFile', type: 'file', required: false, maxSelect: 1, maxSize: 10485760 },
      { name: 'agreementStatus', type: 'text', required: false },
      { name: 'agreementStartDate', type: 'date', required: false },
      { name: 'agreementEndDate', type: 'date', required: false },
      { name: 'agreementNotes', type: 'text', required: false },
    ];

    for (const f of agreementFields) {
      if (!resCol.fields.find((existing) => existing.name === f.name)) {
        resCol.fields.push(f);
        console.log('Adding field:', f.name);
      }
    }

    await pb.collections.update('residents', resCol);
    console.log('Successfully updated residents schema with agreement fields!');
  } catch (err) {
    console.error('Error adding agreement fields:', err);
  }
}

addAgreementFields();
