import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function runTest() {
  try {
    // Authenticate as Admin
    await pb.admins.authWithPassword('admin@hostel.com', 'admin123456');
    console.log('✅ Authenticated as Admin');

    // Fetch active residents
    const residents = await pb.collection('residents').getFullList({ filter: 'status = "active"' });
    if (residents.length === 0) {
      console.log('❌ No active residents found');
      return;
    }

    const targetResident = residents.find(r => r.fullName.includes('Test')) || residents[0];
    console.log(`✅ Selected Resident: ${targetResident.fullName} (${targetResident.id})`);

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Clear existing opt-outs for this resident this month to start fresh
    const startOfMonth = new Date(Date.UTC(year, month, 1)).toISOString();
    const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59)).toISOString();
    
    const existing = await pb.collection('meal_opt_outs').getFullList({
      filter: `resident = "${targetResident.id}" && date >= "${startOfMonth.replace('T', ' ')}" && date <= "${endOfMonth.replace('T', ' ')}"`
    });

    for (const record of existing) {
      await pb.collection('meal_opt_outs').delete(record.id);
    }
    console.log(`✅ Cleared ${existing.length} existing opt-outs for this month.`);

    // Inject 5 Lunch Opt-Outs (Days 1 to 5)
    console.log('Injecting 5 Lunch opt-outs...');
    for (let i = 1; i <= 5; i++) {
      await pb.collection('meal_opt_outs').create({
        resident: targetResident.id,
        date: new Date(Date.UTC(year, month, i, 12)).toISOString(),
        mealType: 'lunch'
      });
    }

    // Inject 3 Dinner Opt-Outs (Days 6 to 8)
    console.log('Injecting 3 Dinner opt-outs...');
    for (let i = 6; i <= 8; i++) {
      await pb.collection('meal_opt_outs').create({
        resident: targetResident.id,
        date: new Date(Date.UTC(year, month, i, 12)).toISOString(),
        mealType: 'dinner'
      });
    }
    
    // Inject 1 "Both" (Lunch + Dinner) Opt-Out (Day 10)
    console.log('Injecting 1 "Both" opt-out (Day 10)...');
    await pb.collection('meal_opt_outs').create({
      resident: targetResident.id,
      date: new Date(Date.UTC(year, month, 10, 12)).toISOString(),
      mealType: 'lunch'
    });
    await pb.collection('meal_opt_outs').create({
      resident: targetResident.id,
      date: new Date(Date.UTC(year, month, 10, 12)).toISOString(),
      mealType: 'dinner'
    });

    console.log('');
    console.log('🎉 RIGOROUS TEST INJECTION COMPLETE!');
    console.log('------------------------------------');
    console.log(`Total Lunch Opt-Outs injected: 6`);
    console.log(`Total Dinner Opt-Outs injected: 4`);
    console.log('');
    console.log('Please go to the Food Bills Tab in the dashboard.');
    console.log(`Verify that ${targetResident.fullName} has exactly:`);
    console.log(`- 6 Lunch Opt-outs (6 x ₹90 = ₹540 deduction)`);
    console.log(`- 4 Dinner Opt-outs (4 x ₹80 = ₹320 deduction)`);
    console.log(`- Total Deduction: ₹860`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTest();
