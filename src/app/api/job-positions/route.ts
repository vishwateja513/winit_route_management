import { NextResponse } from 'next/server'
import pool from '@/lib/database'

// GET /api/job-positions - Get all job positions
export async function GET() {
  try {
    console.log('API: Fetching job positions from database...')
    
    const client = await pool.connect()
    console.log('API: Database connection established')
    
    const result = await client.query(`
      SELECT uid, designation, department, emp_uid
      FROM job_position 
      ORDER BY designation ASC
      LIMIT 50
    `)
    console.log('API: Query executed, found', result.rows.length, 'job positions')
    
    client.release()
    
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('API: Error fetching job positions:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch job positions', 
      details: error.message 
    }, { status: 500 })
  }
}
