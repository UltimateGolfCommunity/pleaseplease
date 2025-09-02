import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const supabase = createServerClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, name, description, maxMembers, user_id: bodyUserId } = body
    
    if (!name) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      )
    }

    // Get the current user from the request
    let user_id = bodyUserId
    
    // Try to get user_id from Authorization header if not in body
    if (!user_id) {
      const authHeader = request.headers.get('authorization')
      if (authHeader) {
        user_id = authHeader.replace('Bearer ', '')
      }
    }
    
    // If still no user_id, return error
    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('golf_groups')
      .insert({
        name,
        description: description || '',
        max_members: maxMembers || 10,
        creator_id: user_id,
        status: 'active'
      })
      .select()
      .single()

    if (groupError) {
      console.error('Database error:', groupError)
      return NextResponse.json(
        { error: 'Failed to create group' },
        { status: 500 }
      )
    }

    // Add creator as first member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id,
        role: 'admin',
        status: 'active'
      })

    if (memberError) {
      console.error('Error adding creator to group:', memberError)
      // Don't fail the request if this fails
    }

    return NextResponse.json({ 
      success: true, 
      group 
    })

  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get groups where user is a member
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        group:golf_groups(*)
      `)
      .eq('user_id', user_id)
      .eq('status', 'active')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch groups' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      groups: data || [] 
    })

  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
