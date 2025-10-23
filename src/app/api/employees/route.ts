import { NextResponse } from 'next/server'
import pool from '@/lib/database'

// GET /api/employees - Get all employees from emp table
export async function GET() {
  try {
    console.log('API: Fetching employees from emp table...')
    const client = await pool.connect()
    console.log('API: Database connection established')
    
    const result = await client.query(`
      SELECT uid, name 
      FROM emp 
      ORDER BY name ASC
    `)
    console.log('API: Query executed, found', result.rows.length, 'employees')
    
    client.release()
    
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('API: Error fetching employees:', error)
    console.error('API: Error details:', error.message)
    return NextResponse.json({ 
      error: 'Failed to fetch employees', 
      details: error.message 
    }, { status: 500 })
  }
}
