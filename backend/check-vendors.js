const mysql = require('mysql2/promise');

async function checkVendors() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'sisters_kitchen'
  });

  const [vendors] = await connection.execute(`
    SELECT 
      v.id, 
      v.businessName, 
      v.pickupLatitude, 
      v.pickupLongitude,
      v.pickupInstructions,
      u.email,
      u.firstName,
      u.lastName
    FROM vendors v
    LEFT JOIN users u ON v.userId = u.id
    LIMIT 10
  `);

  console.log('\n=== VENDORS IN DATABASE ===\n');
  vendors.forEach((v, i) => {
    console.log(`${i + 1}. ${v.businessName}`);
    console.log(`   ID: ${v.id}`);
    console.log(`   Owner: ${v.firstName} ${v.lastName} (${v.email})`);
    console.log(`   Pickup Location: ${v.pickupLatitude ? `✅ ${v.pickupLatitude}, ${v.pickupLongitude}` : '❌ Not set'}`);
    console.log(`   Instructions: ${v.pickupInstructions || 'None'}`);
    console.log('');
  });

  await connection.end();
}

checkVendors().catch(console.error);
