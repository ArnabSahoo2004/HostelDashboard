import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function testCascade() {
  console.log('🚀 Starting Data Integrity Cascade Test...');
  try {
    await pb.admins.authWithPassword('admin@hostel.com', 'admin123456');
    
    // Create a temporary dummy room, bed, resident and booking
    console.log('Creating dummy data...');
    const dummyRoom = await pb.collection('rooms').create({
      roomNumber: '999',
      floor: 9,
      capacity: 5,
      roomType: 'non-ac',
      monthlyRent: 5000,
      hostel: 'Test Hostel'
    });
    const dummyBed = await pb.collection('beds').create({
      room: dummyRoom.id,
      bedLabel: 'T1',
      status: 'occupied'
    });
    const dummyResident = await pb.collection('residents').create({
      fullName: 'Cascade Test Resident',
      status: 'active'
    });
    const dummyBooking = await pb.collection('bookings').create({
      resident: dummyResident.id,
      bed: dummyBed.id,
      checkInDate: new Date().toISOString()
    });

    // Find its beds before deletion
    const bedsBefore = await pb.collection('beds').getFullList({ filter: `room = "${dummyRoom.id}"` });
    console.log(`Found ${bedsBefore.length} beds linked to Dummy Room before deletion.`);

    // Find bookings linked to those beds
    const bedIds = bedsBefore.map(b => `bed = "${b.id}"`).join(' || ');
    const bookingsBefore = await pb.collection('bookings').getFullList({ filter: bedIds });
    console.log(`Found ${bookingsBefore.length} bookings linked to those beds.`);

    // Delete the room
    console.log(`\nDeleting Dummy Room (ID: ${dummyRoom.id})...`);
    await pb.collection('rooms').delete(dummyRoom.id);

    // Verify Cascade Delete
    console.log('Verifying cascade deletions...');
    
    const bedsAfter = await pb.collection('beds').getList(1, 10, { filter: `room = "${dummyRoom.id}"` });
    if (bedsAfter.totalItems === 0) {
      console.log('✅ SUCCESS: All related beds were automatically deleted (Cascade Delete works!).');
    } else {
      console.log(`❌ FAIL: ${bedsAfter.totalItems} beds still remain.`);
    }

    const bookingsAfter = await pb.collection('bookings').getList(1, 10, { filter: bedIds });
    if (bookingsAfter.totalItems === 0) {
      console.log('✅ SUCCESS: All related bookings were automatically deleted (Cascade Delete works!).');
    } else {
      console.log(`❌ FAIL: ${bookingsAfter.totalItems} bookings still remain.`);
    }

  } catch (err) {
    console.error('Error during cascade test:', err);
  }
}

testCascade();
