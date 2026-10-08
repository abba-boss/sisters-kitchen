const mysql = require('mysql2/promise');

async function addPickupPinColumn() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'sisters_kitchen'
  });

  console.log('\n=== ADDING PICKUP PIN COLUMN ===\n');

  try {
    // Check if column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'sisters_kitchen' 
        AND TABLE_NAME = 'orders' 
        AND COLUMN_NAME = 'pickupPin'
    `);

    if (columns.length > 0) {
      console.log('✅ pickupPin column already exists\n');
    } else {
      // Add the pickupPin column
      await connection.execute(`
        ALTER TABLE orders 
        ADD COLUMN pickupPin VARCHAR(6) NULL AFTER pickupToken
      `);
      console.log('✅ Added pickupPin column to orders table\n');
    }

    // Generate PINs for existing pickup orders that don't have one
    const [ordersNeedingPin] = await connection.execute(`
      SELECT id FROM orders 
      WHERE fulfillmentType = 'pickup' 
        AND (pickupPin IS NULL OR pickupPin = '')
    `);

    if (ordersNeedingPin.length > 0) {
      console.log(`Generating PINs for ${ordersNeedingPin.length} existing pickup orders...\n`);
      
      for (const order of ordersNeedingPin) {
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        await connection.execute(
          'UPDATE orders SET pickupPin = ? WHERE id = ?',
          [pin, order.id]
        );
      }
      
      console.log(`✅ Generated ${ordersNeedingPin.length} PINs\n`);
    } else {
      console.log('No existing orders need PINs\n');
    }

    console.log('=== MIGRATION COMPLETE ===\n');
    console.log('Summary:');
    console.log('  - pickupPin column added ✅');
    console.log('  - Existing orders updated ✅');
    console.log('  - New orders will auto-generate 6-digit PINs ✅\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

addPickupPinColumn().catch(console.error);
