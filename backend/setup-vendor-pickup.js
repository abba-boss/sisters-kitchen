const mysql = require('mysql2/promise');

// Lagos coordinates (you can change these)
const SAMPLE_LOCATIONS = {
  'Mama Ngozi\'s Kitchen': { lat: 6.5244, lng: 3.3792, instructions: 'Enter through main gate, look for the red building on the left, counter #5' },
  'Fatima\'s Shawarma Palace': { lat: 6.4541, lng: 3.3947, instructions: 'Ground floor, beside the ATM, ask for Fatima' },
  'Temi\'s Donut Heaven': { lat: 6.6018, lng: 3.3515, instructions: 'Second floor, shop #12, ring the bell' },
  'Amara\'s Fresh Blends': { lat: 6.4474, lng: 3.4700, instructions: 'Walk to the back of the building, near the parking lot' },
  'Remi\'s Fresh Fruits': { lat: 6.5355, lng: 3.3615, instructions: 'Main entrance, first shop on the right' },
};

async function setupPickupLocations() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'sisters_kitchen'
  });

  console.log('\n=== SETTING UP VENDOR PICKUP LOCATIONS ===\n');

  for (const [businessName, location] of Object.entries(SAMPLE_LOCATIONS)) {
    const [result] = await connection.execute(
      `UPDATE vendors 
       SET pickupLatitude = ?, 
           pickupLongitude = ?, 
           pickupInstructions = ?
       WHERE businessName = ?`,
      [location.lat, location.lng, location.instructions, businessName]
    );

    if (result.affectedRows > 0) {
      console.log(`✅ ${businessName}`);
      console.log(`   Location: ${location.lat}, ${location.lng}`);
      console.log(`   Instructions: ${location.instructions}\n`);
    }
  }

  console.log('=== UPDATED VENDORS ===\n');
  
  const [vendors] = await connection.execute(`
    SELECT businessName, pickupLatitude, pickupLongitude, pickupInstructions
    FROM vendors
    WHERE pickupLatitude IS NOT NULL
  `);

  vendors.forEach((v, i) => {
    console.log(`${i + 1}. ${v.businessName} - ${v.pickupLatitude}, ${v.pickupLongitude}`);
  });

  console.log(`\n✨ ${vendors.length} vendors now have pickup locations!\n`);

  await connection.end();
}

setupPickupLocations().catch(console.error);
