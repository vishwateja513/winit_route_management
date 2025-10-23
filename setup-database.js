const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS routes (
        id SERIAL PRIMARY KEY,
        route VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'Active',
        role VARCHAR(100) NOT NULL,
        employee_id VARCHAR(50) NOT NULL,
        organization VARCHAR(255) NOT NULL,
        assignment VARCHAR(255) NOT NULL,
        valid_from DATE NOT NULL,
        valid_upto DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Additional tables removed - only routes table needed

    console.log('✅ Database tables created successfully');
    
    // Insert sample data
    await client.query(`
      INSERT INTO routes (route, status, role, employee_id, organization, assignment, valid_from, valid_upto) VALUES
      ('Downtown Express', 'Active', 'Driver', 'EMP001', 'Transport Co.', 'Route A', '2024-01-01', '2024-12-31'),
      ('Airport Route', 'Active', 'Supervisor', 'EMP002', 'Transport Co.', 'Route B', '2024-02-01', '2024-12-31'),
      ('University Loop', 'Inactive', 'Driver', 'EMP003', 'Transport Co.', 'Route C', '2024-01-15', '2024-06-30'),
      ('Industrial Zone', 'Active', 'Manager', 'EMP004', 'Transport Co.', 'Route D', '2024-03-01', '2024-12-31')
      ON CONFLICT DO NOTHING
    `);

    console.log('✅ Sample data inserted successfully');
    client.release();
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();
