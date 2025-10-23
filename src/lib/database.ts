import { Pool } from 'pg'

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,// || 'postgresql://username:password@localhost:5432/route_management',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
})

export default pool

// Database initialization function
export async function initializeDatabase() {
  try {
    const client = await pool.connect()
    
    // Create tables if they don't exist
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
    `)

    // Additional tables removed - only routes table needed

    client.release()
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization failed:', error)
    throw error
  }
}
