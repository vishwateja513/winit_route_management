import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'

// GET /api/routes - Get all routes
export async function GET() {
  try {
    console.log('API: Fetching routes from database...')
    console.log('API: Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')
    
    const client = await pool.connect()
    console.log('API: Database connection established')
    
    const result = await client.query(`
      SELECT 
        id,
        name as route,
        status,
        role_uid as role,
        job_position_uid as employee_id,
        org_uid as organization,
        code as assignment,
        valid_from,
        valid_upto
      FROM route 
      WHERE is_active = true 
      ORDER BY created_time DESC
    `)
    console.log('API: Query executed, found', result.rows.length, 'routes')
    console.log('API: Sample route:', result.rows[0])
    
    client.release()
    
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('API: Error fetching routes:', error)
    console.error('API: Error details:', error.message)
    return NextResponse.json({ 
      error: 'Failed to fetch routes', 
      details: error.message 
    }, { status: 500 })
  }
}

// POST /api/routes - Create a new route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('API: Creating route with data:', body)
    
    const {
      name,
      code,
      role_uid,
      job_position_uid,
      org_uid,
      principal_uid,
      assignment_role_uid,
      primary_employee_uid,
      warehouse_uid,
      vehicle_type,
      status,
      valid_from,
      valid_upto,
      visit_duration,
      travel_time,
      visit_time,
      end_time,
      auto_freeze_run_time,
      is_customer_with_time,
      // Additional fields from the database schema
      wh_org_uid,
      vehicle_uid,
      location_uid,
      print_standing,
      print_topup,
      print_order_summary,
      auto_freeze_jp,
      add_to_run,
      ss,
      total_customers,
      print_forward
    } = body
    
    const client = await pool.connect()
    
    // Generate a unique UID for the route
    const uid = `RT${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    
    const result = await client.query(`
      INSERT INTO route (
        uid, created_by, created_time, modified_by, modified_time,
        server_add_time, server_modified_time, company_uid, code, name,
        role_uid, org_uid, job_position_uid, is_active, status,
        valid_from, valid_upto, visit_duration, travel_time, visit_time, end_time,
        auto_freeze_run_time, is_customer_with_time
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23
      ) RETURNING *
    `, [
      uid,
      'ADMIN', // created_by
      new Date(), // created_time
      'ADMIN', // modified_by
      new Date(), // modified_time
      new Date(), // server_add_time
      new Date(), // server_modified_time
      org_uid || 'EPIC01', // company_uid
      code,
      name,
      role_uid || 'Admin', // Use valid role UID or default to Admin
      org_uid || 'EPIC01',
      job_position_uid || 'SUPERVISOR', // Use valid job position UID or default to SUPERVISOR
      true, // is_active
      status || 'Active',
      valid_from || new Date().toISOString().split('T')[0], // Default to today if empty
      valid_upto || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 1 year from now if empty
      visit_duration || 30,
      travel_time || 15,
      visit_time,
      end_time,
      auto_freeze_run_time,
      is_customer_with_time || false
    ])
    
    client.release()
    console.log('API: Route created successfully:', result.rows[0])
    
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('API: Error creating route:', error)
    return NextResponse.json({ 
      error: 'Failed to create route', 
      details: error.message 
    }, { status: 500 })
  }
}
