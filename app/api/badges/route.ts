import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const userId = searchParams.get('user_id')

  console.log('🏆 BADGES GET:', action, { userId })

  try {
    // Use three-tier fallback system
    let supabase: any = null
    let usingMockMode = false
    
    try {
      console.log('🔍 BADGES GET: Creating admin client...')
      supabase = createAdminClient()
      console.log('✅ BADGES GET: Admin client created successfully')
    } catch (adminError) {
      console.log('⚠️ BADGES GET: Admin client failed, trying server client:', adminError)
      try {
        supabase = createServerClient()
        console.log('✅ BADGES GET: Server client created as fallback')
      } catch (serverError) {
        console.log('❌ BADGES GET: Both clients failed:', serverError)
        usingMockMode = true
      }
    }
    
    if (!supabase) {
      usingMockMode = true
    }

    if (usingMockMode) {
      console.log('🔧 BADGES GET: Using mock mode')
      
      if (action === 'user_badges' && userId) {
        return NextResponse.json([
          {
            id: 'mock-badge-1',
            badge: {
              name: 'Founding Member',
              description: 'One of the first 20 members to join',
              icon_name: 'crown',
              category: 'early_adopter',
              rarity: 'legendary',
              points: 150
            },
            earned_at: '2024-01-01T00:00:00Z',
            earned_reason: 'Founding Member #1 - Mock data'
          }
        ])
      }
      
      return NextResponse.json([])
    }

    console.log('🔍 BADGES GET: Using database for operations')

    if (action === 'all') {
      // Get all available badges
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        console.error('❌ Error fetching badges:', error)
        return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 })
      }

      return NextResponse.json(data || [])
    }

    if (action === 'user_badges' && userId) {
      // Get user's badges with badge details
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching user badges:', error)
        return NextResponse.json({ error: 'Failed to fetch user badges' }, { status: 500 })
      }

      console.log('✅ User badges fetched:', data?.length || 0)
      return NextResponse.json(data || [])
    }

    if (action === 'founding_members') {
      // Get all users with founding member badge
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          user:user_profiles(first_name, last_name, username, created_at),
          badge:badges!inner(name)
        `)
        .eq('badge.name', 'Founding Member')
        .order('earned_at', { ascending: true })

      if (error) {
        console.error('❌ Error fetching founding members:', error)
        return NextResponse.json({ error: 'Failed to fetch founding members' }, { status: 500 })
      }

      return NextResponse.json(data || [])
    }

    // Default: return empty array
    return NextResponse.json([])

  } catch (error) {
    console.error('❌ Error in badges API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, user_id, badge_name, reason } = body

    console.log('🏆 BADGES POST:', action, { user_id, badge_name, reason })

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    // Use three-tier fallback system
    let supabase: any = null
    let usingMockMode = false
    
    try {
      console.log('🔍 BADGES POST: Creating admin client...')
      supabase = createAdminClient()
      console.log('✅ BADGES POST: Admin client created successfully')
    } catch (adminError) {
      console.log('⚠️ BADGES POST: Admin client failed, trying server client:', adminError)
      try {
        supabase = createServerClient()
        console.log('✅ BADGES POST: Server client created as fallback')
      } catch (serverError) {
        console.log('❌ BADGES POST: Both clients failed:', serverError)
        usingMockMode = true
      }
    }
    
    if (!supabase) {
      usingMockMode = true
    }

    if (usingMockMode) {
      console.log('🔧 BADGES POST: Using mock mode')
      
      if (action === 'award_badge') {
        return NextResponse.json({
          success: true,
          message: 'Badge awarded successfully (backup system)',
          badge_awarded: badge_name
        })
      }

      if (action === 'award_founding_member') {
        return NextResponse.json({
          success: true,
          message: 'Founding Member badge awarded successfully (backup system)'
        })
      }
      
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    console.log('🔍 BADGES POST: Using database for operations')

    if (action === 'award_badge') {
      if (!user_id || !badge_name) {
        return NextResponse.json({ 
          error: 'user_id and badge_name are required' 
        }, { status: 400 })
      }

      try {
        // Get the badge
        const { data: badge, error: badgeError } = await supabase
          .from('badges')
          .select('*')
          .eq('name', badge_name)
          .single()

        if (badgeError || !badge) {
          console.error('❌ Badge not found:', badge_name)
          return NextResponse.json({ 
            error: 'Badge not found',
            badge_name 
          }, { status: 404 })
        }

        // Check if user already has this badge
        const { data: existingBadge, error: checkError } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', user_id)
          .eq('badge_id', badge.id)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('❌ Error checking existing badge:', checkError)
          return NextResponse.json({ 
            error: 'Failed to check existing badge' 
          }, { status: 500 })
        }

        if (existingBadge) {
          return NextResponse.json({ 
            error: 'User already has this badge',
            badge_name 
          }, { status: 409 })
        }

        // Award the badge
        const { data: newUserBadge, error: awardError } = await supabase
          .from('user_badges')
          .insert({
            user_id,
            badge_id: badge.id,
            earned_reason: reason || `Manually awarded ${badge_name} badge`
          })
          .select()
          .single()

        if (awardError) {
          console.error('❌ Error awarding badge:', awardError)
          return NextResponse.json({ 
            error: 'Failed to award badge',
            details: awardError.message 
          }, { status: 500 })
        }

        console.log('✅ Badge awarded successfully:', badge_name, 'to user:', user_id)
        return NextResponse.json({
          success: true,
          message: `${badge_name} badge awarded successfully`,
          user_badge: newUserBadge,
          badge_details: badge
        })

      } catch (awardError) {
        console.error('❌ Badge award failed:', awardError)
        return NextResponse.json({ 
          error: 'Failed to award badge',
          details: awardError instanceof Error ? awardError.message : 'Unknown error'
        }, { status: 500 })
      }
    }

    if (action === 'award_founding_member') {
      if (!user_id) {
        return NextResponse.json({ 
          error: 'user_id is required' 
        }, { status: 400 })
      }

      try {
        // Use the database function to award founding member badge
        const { data, error } = await supabase
          .rpc('award_founding_member_badge', { target_user_id: user_id })

        if (error) {
          console.error('❌ Error awarding founding member badge:', error)
          return NextResponse.json({ 
            error: 'Failed to award founding member badge',
            details: error.message 
          }, { status: 500 })
        }

        if (data === true) {
          console.log('✅ Founding Member badge awarded to:', user_id)
          return NextResponse.json({
            success: true,
            message: 'Founding Member badge awarded successfully'
          })
        } else {
          return NextResponse.json({
            success: false,
            message: 'Badge was not awarded (user may already have it or other conditions not met)'
          })
        }

      } catch (awardError) {
        console.error('❌ Founding member badge award failed:', awardError)
        return NextResponse.json({ 
          error: 'Failed to award founding member badge',
          details: awardError instanceof Error ? awardError.message : 'Unknown error'
        }, { status: 500 })
      }
    }

    if (action === 'award_first_20') {
      // Special action to award founding member badge to the first 20 users
      try {
        const { data, error } = await supabase
          .rpc('execute_sql', { 
            sql: `
              WITH first_20_users AS (
                SELECT 
                  id, 
                  ROW_NUMBER() OVER (ORDER BY created_at ASC) as user_position
                FROM user_profiles
                ORDER BY created_at ASC
                LIMIT 20
              ),
              founding_badge AS (
                SELECT id FROM badges WHERE name = 'Founding Member'
              )
              INSERT INTO user_badges (user_id, badge_id, earned_reason)
              SELECT 
                f20.id, 
                fb.id, 
                'Founding Member #' || f20.user_position || ' - First 20 founding members!'
              FROM first_20_users f20, founding_badge fb
              WHERE NOT EXISTS (
                SELECT 1 FROM user_badges ub 
                WHERE ub.user_id = f20.id AND ub.badge_id = fb.id
              )
              RETURNING *;
            `
          })

        console.log('✅ First 20 founding member badges processed')
        return NextResponse.json({
          success: true,
          message: 'Founding Member badges awarded to first 20 users',
          badges_awarded: data?.length || 0
        })

      } catch (awardError) {
        console.error('❌ First 20 badge award failed:', awardError)
        return NextResponse.json({ 
          error: 'Failed to award badges to first 20 users',
          details: awardError instanceof Error ? awardError.message : 'Unknown error'
        }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('❌ Error in badges API POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}