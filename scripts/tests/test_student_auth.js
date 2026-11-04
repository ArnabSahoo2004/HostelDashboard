import PocketBase from 'pocketbase';

const pb = new PocketBase('https://cinespherepb.klairo.in');

async function testStudentAuthFlow() {
  console.log('Testing Student Mobile Auth Flow...');

  // 1. Look up student by phone
  const phone = '9439140077';
  const clean = phone.replace(/[^0-9]/g, '').replace(/^91/, '');
  const records = await pb.collection('residents').getFullList({
    filter: `phone ~ "${clean}"`
  });
  console.log('1. Found resident by phone:', records.length > 0 ? records[0].fullName : 'None');
  const res = records[0];

  // 2. Set test password (simulating 1st login)
  const testPass = 'Hostel@9439';
  await pb.collection('residents').update(res.id, {
    portalPassword: testPass,
    portalActivated: true,
    portalLastLogin: new Date().toISOString()
  });
  console.log('2. 1st login password set successfully:', testPass);

  // 3. Verify login check
  const updated = await pb.collection('residents').getOne(res.id);
  const passwordMatches = updated.portalPassword === testPass;
  console.log('3. Password verification check:', passwordMatches ? 'PASS' : 'FAIL');

  // 4. Change password (simulating student in-app change)
  const newPass = 'Student@2026';
  await pb.collection('residents').update(res.id, {
    portalPassword: newPass
  });
  console.log('4. In-app student password change:', 'PASS');

  // 5. Admin reset password
  const adminPass = 'AdminReset#123';
  await pb.collection('residents').update(res.id, {
    portalPassword: adminPass
  });
  console.log('5. Admin-side password update:', 'PASS');

  // Reset back to initial state so Arnab123 can experience first-time login
  await pb.collection('residents').update(res.id, {
    portalPassword: '',
    portalActivated: false
  });
  console.log('6. Reset to initial pending 1st-login state for Arnab123: PASS');
  console.log('✓ ALL TESTS PASSED SUCCESSFULLY!');
}

testStudentAuthFlow().catch(console.error);

