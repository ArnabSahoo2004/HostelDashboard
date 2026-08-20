import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function seedLogs() {
  try {
    console.log('Authenticating as admin...');
    await pb.collection('_superusers').authWithPassword('admin@hostel.com', 'admin123456');

    const residents = await pb.collection('residents').getFullList();
    if (residents.length === 0) {
      console.log('No residents found. Please seed residents first.');
      return;
    }

    const resident = residents[0]; // John Doe
    console.log('Seeding entry logs for', resident.fullName);

    // Create a few logs for today and yesterday
    const now = new Date();
    
    // Yesterday Morning Exit
    const yesterdayMorning = new Date(now);
    yesterdayMorning.setDate(yesterdayMorning.getDate() - 1);
    yesterdayMorning.setHours(8, 30, 0, 0);
    
    await pb.collection('entry_logs').create({
      resident: resident.id,
      timestamp: yesterdayMorning.toISOString(),
      type: 'Exit',
      method: 'Face'
    });

    // Yesterday Evening Entry
    const yesterdayEvening = new Date(now);
    yesterdayEvening.setDate(yesterdayEvening.getDate() - 1);
    yesterdayEvening.setHours(18, 45, 0, 0);

    await pb.collection('entry_logs').create({
      resident: resident.id,
      timestamp: yesterdayEvening.toISOString(),
      type: 'Entry',
      method: 'Fingerprint'
    });

    // Today Morning Exit
    const todayMorning = new Date(now);
    todayMorning.setHours(9, 15, 0, 0);

    await pb.collection('entry_logs').create({
      resident: resident.id,
      timestamp: todayMorning.toISOString(),
      type: 'Exit',
      method: 'Card'
    });

    console.log('Successfully seeded entry logs!');
  } catch (error) {
    console.error('Error seeding entry logs:', error.data || error.message);
  }
}

seedLogs();
