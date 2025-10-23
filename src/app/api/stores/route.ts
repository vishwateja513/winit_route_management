import { NextResponse } from 'next/server'
import pool from '@/lib/database'

// GET /api/stores - Get all stores for customer selection
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    
    console.log('API: Fetching stores with search:', search)
    const client = await pool.connect()
    console.log('API: Database connection established')
    
    let query = `
      SELECT uid, name, alias_name, legal_name, type, status, city_uid, state_uid, country_uid
      FROM store 
      WHERE is_active = true
    `
    let params: any[] = []
    
    if (search) {
      query += ` AND (name ILIKE $1 OR alias_name ILIKE $1 OR legal_name ILIKE $1)`
      params.push(`%${search}%`)
    }
    
    query += ` ORDER BY name ASC LIMIT 100`
    
    const result = await client.query(query, params)
    console.log('API: Query executed, found', result.rows.length, 'stores')
    
    client.release()
    
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('API: Error fetching stores:', error)
    console.error('API: Error details:', error.message)
    return NextResponse.json({ 
      error: 'Failed to fetch stores', 
      details: error.message 
    }, { status: 500 })
  }
}
