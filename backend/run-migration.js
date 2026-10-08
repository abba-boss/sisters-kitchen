// Quick script to run database migration
const mysql = require('mysql2/promise');

async function runMigration() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'sisters_kitchen'
    });

    console.log('✅ Connected to database');

    // Add columns to vendors table
    try {
      await connection.query(`
        ALTER TABLE vendors 
        ADD COLUMN pickupLatitude DECIMAL(10,7) NULL
      `);
      console.log('✅ Added pickupLatitude to vendors');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  pickupLatitude already exists');
      } else throw e;
    }

    try {
      await connection.query(`
        ALTER TABLE vendors 
        ADD COLUMN pickupLongitude DECIMAL(10,7) NULL
      `);
      console.log('✅ Added pickupLongitude to vendors');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  pickupLongitude already exists');
      } else throw e;
    }

    try {
      await connection.query(`
        ALTER TABLE vendors 
        ADD COLUMN pickupInstructions TEXT NULL
      `);
      console.log('✅ Added pickupInstructions to vendors');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  pickupInstructions already exists');
      } else throw e;
    }

    // Add columns to orders table
    try {
      await connection.query(`
        ALTER TABLE orders 
        ADD COLUMN fulfillmentType ENUM('delivery', 'pickup') DEFAULT 'delivery' NOT NULL
      `);
      console.log('✅ Added fulfillmentType to orders');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  fulfillmentType already exists');
      } else throw e;
    }

    try {
      await connection.query(`
        ALTER TABLE orders 
        ADD COLUMN pickupToken VARCHAR(255) NULL UNIQUE
      `);
      console.log('✅ Added pickupToken to orders');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  pickupToken already exists');
      } else throw e;
    }

    try {
      await connection.query(`
        ALTER TABLE orders 
        ADD COLUMN pickupVerifiedAt TIMESTAMP NULL
      `);
      console.log('✅ Added pickupVerifiedAt to orders');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  pickupVerifiedAt already exists');
      } else throw e;
    }

    try {
      await connection.query(`
        ALTER TABLE orders 
        ADD COLUMN pickupVerifiedBy VARCHAR(255) NULL
      `);
      console.log('✅ Added pickupVerifiedBy to orders');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  pickupVerifiedBy already exists');
      } else throw e;
    }

    console.log('\n🎉 Migration completed successfully!');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
