import { NextResponse } from 'next/server'
import pool from '@/lib/database'

// GET /api/warehouses - Get all warehouses from org table where org_type_uid indicates warehouse
export async function GET() {
  try {
    console.log('API: Fetching warehouses from org table...')
    const client = await pool.connect()
    console.log('API: Database connection established')
    
    const result = await client.query(`
      SELECT uid, name 
      FROM org 
      WHERE org_type_uid = 'WAREHOUSE' OR name ILIKE '%warehouse%' OR name ILIKE '%wh%'
      ORDER BY name ASC
    `)
    console.log('API: Query executed, found', result.rows.length, 'warehouses')
    
    client.release()
    
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('API: Error fetching warehouses:', error)
    console.error('API: Error details:', error.message)
    return NextResponse.json({ 
      error: 'Failed to fetch warehouses', 
      details: error.message 
    }, { status: 500 })
  }
}
