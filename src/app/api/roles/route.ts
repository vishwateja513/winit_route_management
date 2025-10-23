import { NextResponse } from 'next/server'
import pool from '@/lib/database'

// GET /api/roles - Get all roles from roles table
export async function GET() {
  try {
    console.log('API: Fetching roles from roles table...')
    const client = await pool.connect()
    console.log('API: Database connection established')
    
    const result = await client.query(`
      SELECT uid, role_name_en as name 
      FROM roles 
      WHERE is_active = true 
      ORDER BY role_name_en ASC
    `)
    console.log('API: Query executed, found', result.rows.length, 'roles')
    
    client.release()
    
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('API: Error fetching roles:', error)
    console.error('API: Error details:', error.message)
    return NextResponse.json({ 
      error: 'Failed to fetch roles', 
      details: error.message 
    }, { status: 500 })
  }
}
