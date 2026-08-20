const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://127.0.0.1:8090');

async function test() {
  try {
    const records = await pb.collection('meal_opt_outs').getFullList();
    console.log(JSON.stringify(records.map(r => typeof r.export === 'function' ? r.export() : r), null, 2));
  } catch (err) {
    console.error(err);
  }
}
test();
