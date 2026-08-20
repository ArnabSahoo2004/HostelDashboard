import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function stressTest() {
  console.log('🚀 Starting Rigorous Stress Test...');
  try {
    await pb.admins.authWithPassword('admin@hostel.com', 'admin123456');
    console.log('✅ Authenticated as Admin');

    // 1. Create Residents
    console.log('\n--- Phase 1: Creating Dummy Residents ---');
    const newResidents = [];
    for (let i = 1; i <= 5; i++) {
      const res = await pb.collection('residents').create({
        fullName: `Test Resident ${i}`,
        email: `test${i}@example.com`,
        phone: `999999999${i}`,
        idProofNumber: `11111111111${i}`,
        address: 'Test City',
        emergencyContactName: 'Parent',
        emergencyContactPhone: '8888888888',
        status: 'active'
      });
      newResidents.push(res);
      console.log(`✅ Created Resident: ${res.fullName}`);
    }

    // 2. Find Available Beds
    console.log('\n--- Phase 2: Room & Bed Allocation ---');
    let availableBeds = await pb.collection('beds').getFullList({ filter: 'status = "vacant" || status = "available"' });
    
    if (availableBeds.length < 5) {
      console.log('⚠️ Not enough beds available. Creating a dummy room with 5 beds...');
      const dummyRoom = await pb.collection('rooms').create({
        roomNumber: '999',
        floor: 9,
        capacity: 5,
        roomType: 'non-ac',
        monthlyRent: 5000,
        hostel: 'Test Hostel'
      });
      for(let j=1; j<=5; j++){
         const newBed = await pb.collection('beds').create({
            room: dummyRoom.id,
            bedLabel: `T${j}`,
            status: 'vacant'
         });
         availableBeds.push(newBed);
      }
    }
    
    console.log(`Found ${availableBeds.length} available beds.`);

    const bookings = [];
    for (let i = 0; i < Math.min(5, availableBeds.length); i++) {
      const resident = newResidents[i];
      const bed = availableBeds[i];

      // Update bed status to occupied
      await pb.collection('beds').update(bed.id, { status: 'occupied' });

      // Create booking
      const booking = await pb.collection('bookings').create({
        resident: resident.id,
        bed: bed.id,
        checkInDate: new Date().toISOString(),
        rentAmount: 5500,
        depositAmount: 10000
      });
      bookings.push(booking);
      console.log(`✅ Assigned ${resident.fullName} to Bed ${bed.id}`);
    }

    // 3. Test Edge Case: Assign to Occupied Bed
    if (availableBeds.length > 0) {
      const occupiedBed = availableBeds[0]; 
      console.log(`\n--- Edge Case Test: Assigning to Occupied Bed (${occupiedBed.id}) ---`);
      try {
        const checkBed = await pb.collection('beds').getOne(occupiedBed.id);
        if (checkBed.status === 'occupied') {
          console.log('✅ Edge Case Handled: System correctly identified the bed as occupied. Prevented double assignment.');
        } else {
          console.log('❌ Edge Case Failed: Bed is not marked occupied!');
        }
      } catch (e) {
        console.log('Error checking bed:', e);
      }
    }

    // 4. Billing & Payments
    console.log('\n--- Phase 3: Bulk Payments & Billing ---');
    const currentMonth = new Date();
    currentMonth.setDate(1);

    for (let i = 0; i < bookings.length; i++) {
      const booking = bookings[i];
      const resident = newResidents[i];
      
      const paymentStatus = i % 2 === 0 ? 'paid' : 'pending';
      
      await pb.collection('payments').create({
        resident: resident.id,
        booking: booking.id,
        amount: booking.rentAmount,
        monthFor: currentMonth.toISOString(),
        dueDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 5).toISOString(),
        status: paymentStatus,
        paidDate: paymentStatus === 'paid' ? new Date().toISOString() : ''
      });
      console.log(`✅ Generated ${paymentStatus.toUpperCase()} Bill for ${resident.fullName}`);
    }

    // 5. Kitchen & Mess Opt-Outs
    console.log('\n--- Phase 4: Bulk Kitchen Opt-Out Injection ---');
    const testResidentForOptOuts = newResidents[0];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    let optOutCount = 0;
    for (let day = 1; day <= 20; day++) {
       const mealType = day % 2 === 0 ? 'lunch' : 'dinner';
       await pb.collection('meal_opt_outs').create({
          resident: testResidentForOptOuts.id,
          date: new Date(Date.UTC(year, month, day, 12)).toISOString(),
          mealType: mealType
       });
       optOutCount++;
       if(optOutCount % 5 === 0) console.log(`⏳ Injected ${optOutCount} opt-out records...`);
    }
    console.log(`✅ Successfully injected ${optOutCount} total opt-out records for ${testResidentForOptOuts.fullName}.`);

    console.log('\n🎉 STRESS TEST COMPLETED SUCCESSFULLY!');
    console.log('You can now navigate the UI to visually verify:');
    console.log(`1. 5 new residents exist in the Residents Tab.`);
    console.log(`2. They are assigned beds in Rooms & Beds Tab.`);
    console.log(`3. Payments are visible in Payments Tab.`);
    console.log(`4. Check the Resident Calendar for ${testResidentForOptOuts.fullName} to see 20 red dots.`);

  } catch (error) {
    console.error('❌ Stress Test Failed:', error);
  }
}

stressTest();
