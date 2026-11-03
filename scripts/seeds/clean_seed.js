import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function cleanAndSeed() {
  try {
    await pb.collection('_superusers').authWithPassword('admin@hostel.com', 'admin123456');

    // Delete all records
    const collections = ['entry_logs', 'payments', 'bookings', 'beds', 'rooms', 'residents'];
    for (const col of collections) {
      const records = await pb.collection(col).getFullList();
      for (const record of records) {
        await pb.collection(col).delete(record.id);
      }
      console.log(`Cleared ${col}`);
    }

    // Seed Data
    console.log('Creating Room 101...');
    const room1 = await pb.collection('rooms').create({
      roomNumber: '101',
      floor: 1,
      capacity: 2,
      roomType: 'ac',
      monthlyRent: 6000,
      hostel: 'Boys Hostel A'
    });

    console.log('Creating Beds for Room 101...');
    const bed1A = await pb.collection('beds').create({
      room: room1.id,
      bedLabel: 'A',
      status: 'occupied'
    });

    await pb.collection('beds').create({
      room: room1.id,
      bedLabel: 'B',
      status: 'vacant'
    });

    console.log('Creating Resident John Doe...');
    const resident1 = await pb.collection('residents').create({
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '9876543210',
      idProofNumber: '123456789012',
      address: '123 Main Street, City',
      emergencyContactName: 'Jane Doe',
      emergencyContactPhone: '9876543211',
      status: 'active'
    });

    console.log('Creating Booking for John Doe...');
    const booking1 = await pb.collection('bookings').create({
      resident: resident1.id,
      bed: bed1A.id,
      checkInDate: new Date().toISOString(),
      checkOutDate: '',
      rentAmount: 6000,
      depositAmount: 12000
    });

    console.log('Creating Payment for John Doe...');
    const currentMonth = new Date();
    currentMonth.setDate(1); 
    const dueDate = new Date();
    dueDate.setDate(5); 
    
    await pb.collection('payments').create({
      resident: resident1.id,
      booking: booking1.id,
      amount: 6000,
      monthFor: currentMonth.toISOString(),
      dueDate: dueDate.toISOString(),
      status: 'paid',
      paidDate: new Date().toISOString()
    });

    console.log('Seeding Entry Logs...');
    const now = new Date();
    const yesterdayMorning = new Date(now);
    yesterdayMorning.setDate(yesterdayMorning.getDate() - 1);
    yesterdayMorning.setHours(8, 30, 0, 0);
    
    await pb.collection('entry_logs').create({
      resident: resident1.id,
      timestamp: yesterdayMorning.toISOString(),
      type: 'Exit',
      method: 'Face'
    });

    const yesterdayEvening = new Date(now);
    yesterdayEvening.setDate(yesterdayEvening.getDate() - 1);
    yesterdayEvening.setHours(18, 45, 0, 0);

    await pb.collection('entry_logs').create({
      resident: resident1.id,
      timestamp: yesterdayEvening.toISOString(),
      type: 'Entry',
      method: 'Fingerprint'
    });

    const todayMorning = new Date(now);
    todayMorning.setHours(9, 15, 0, 0);

    await pb.collection('entry_logs').create({
      resident: resident1.id,
      timestamp: todayMorning.toISOString(),
      type: 'Exit',
      method: 'Card'
    });

    console.log('Done cleaning and seeding!');
  } catch (err) {
    console.log('Error:', err.message || err);
  }
}

cleanAndSeed();
