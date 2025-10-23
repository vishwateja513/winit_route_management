import { NextResponse } from 'next/server'
import pool from '@/lib/database'

// GET /api/principals - Get all principals from org table
export async function GET() {
  try {
    console.log('API: Fetching principals from org table...')
    const client = await pool.connect()
    console.log('API: Database connection established')
    
    const result = await client.query(`
      SELECT uid, name 
      FROM org 
      WHERE is_active = true 
      ORDER BY name ASC
    `)
    console.log('API: Query executed, found', result.rows.length, 'principals')
    
    client.release()
    
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('API: Error fetching principals:', error)
    console.error('API: Error details:', error.message)
    return NextResponse.json({ 
      error: 'Failed to fetch principals', 
      details: error.message 
    }, { status: 500 })
  }
}

