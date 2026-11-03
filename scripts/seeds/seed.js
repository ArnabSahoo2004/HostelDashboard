import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function seed() {
  try {
    console.log('Authenticating as admin...');
    await pb.collection('_superusers').authWithPassword('admin@hostel.com', 'admin123456');

    console.log('Creating Room 101...');
    const room1 = await pb.collection('rooms').create({
      roomNumber: '101',
      floor: 1,
      capacity: 2,
      type: 'ac',
      baseRent: 6000,
      hostel: 'Boys Hostel A'
    });

    console.log('Creating Beds for Room 101...');
    const bed1A = await pb.collection('beds').create({
      room: room1.id,
      bedLabel: 'A',
      status: 'occupied'
    });

    const bed1B = await pb.collection('beds').create({
      room: room1.id,
      bedLabel: 'B',
      status: 'available'
    });

    console.log('Creating Resident John Doe...');
    const resident1 = await pb.collection('residents').create({
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '9876543210',
      adharNumber: '123456789012',
      address: '123 Main Street, City',
      emergencyContact: '9876543211',
      status: 'active'
    });

    console.log('Creating Booking for John Doe in Room 101 Bed A...');
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
    currentMonth.setDate(1); // Set to start of month
    const dueDate = new Date();
    dueDate.setDate(5); // Due on 5th
    
    await pb.collection('payments').create({
      resident: resident1.id,
      booking: booking1.id,
      amount: 6000,
      monthFor: currentMonth.toISOString(),
      dueDate: dueDate.toISOString(),
      status: 'paid',
      paidDate: new Date().toISOString()
    });

    console.log('Creating Room 201 (Non-AC)...');
    const room2 = await pb.collection('rooms').create({
      roomNumber: '201',
      floor: 2,
      capacity: 3,
      type: 'non-ac',
      baseRent: 4000,
      hostel: 'Boys Hostel A'
    });

    console.log('Creating Beds for Room 201...');
    await pb.collection('beds').create({ room: room2.id, bedLabel: 'A', status: 'available' });
    await pb.collection('beds').create({ room: room2.id, bedLabel: 'B', status: 'available' });
    await pb.collection('beds').create({ room: room2.id, bedLabel: 'C', status: 'available' });

    console.log('Dummy data seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error.data || error.message);
  }
}

seed();
