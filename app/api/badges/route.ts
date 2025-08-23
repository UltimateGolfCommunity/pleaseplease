import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Mock data for development when Supabase is not configured
const mockBadges = [
  {
    id: 'mock-badge-1',
    name: 'First Round',
    description: 'Complete your first golf round',
    icon_name: 'flag',
    category: 'achievement',
    points: 10,
    rarity: 'common',
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-badge-2',
    name: 'Early Adopter',
    description: 'One of the first users',
    icon_name: 'star',
    category: 'early_adopter',
    points: 50,
    rarity: 'rare',
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-badge-3',
    name: 'Birdie Master',
    description: 'Score 5 birdies in a single round',
    icon_name: 'trophy',
    category: 'achievement',
    points: 25,
    rarity: 'uncommon',
    created_at: new Date().toISOString()
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const category = searchParams.get('category')
    
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Using mock data for badges API')
      
      let badges = mockBadges
      if (category) {
        badges = badges.filter(badge => badge.category === category)
      }
      
      // Add mock user badges if user_id is provided
      if (user_id) {
        const mockUserBadges = [
          {
            badge_id: 'mock-badge-1',
            earned_at: new Date().toISOString(),
            earned_reason: 'Development mode'
          }
        ]
        
        const badgesWithEarnedStatus = badges.map(badge => ({
          ...badge,
          is_earned: mockUserBadges.some(ub => ub.badge_id === badge.id),
          earned_at: mockUserBadges.find(ub => ub.badge_id === badge.id)?.earned_at || null,
          earned_reason: mockUserBadges.find(ub => ub.badge_id === badge.id)?.earned_reason || null
        }))
        
        return NextResponse.json({ 
          success: true, 
          badges: badgesWithEarnedStatus,
          user_badges: mockUserBadges
        })
      }
      
      return NextResponse.json({ 
        success: true, 
        badges: badges
      })
    }
    
    // Use real Supabase if configured
    const supabase = createServerClient()
    
    let query = supabase
      .from('badges')
      .select('*')
      .order('points', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: badges, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch badges' },
        { status: 500 }
      )
    }

    // If user_id is provided, also fetch user's earned badges
    if (user_id) {
      const { data: userBadges, error: userBadgesError } = await supabase
        .from('user_badges')
        .select(`
          badge_id,
          earned_at,
          earned_reason
        `)
        .eq('user_id', user_id)

      if (!userBadgesError) {
        // Create a map of earned badge IDs
        const earnedBadgeIds = new Set(userBadges?.map((ub: any) => ub.badge_id) || [])
        
        // Add earned status to badges
        const badgesWithEarnedStatus = badges?.map((badge: any) => ({
          ...badge,
          is_earned: earnedBadgeIds.has(badge.id),
          earned_at: userBadges?.find((ub: any) => ub.badge_id === badge.id)?.earned_at || null,
          earned_reason: userBadges?.find((ub: any) => ub.badge_id === badge.id)?.earned_reason || null
        }))

        return NextResponse.json({ 
          success: true, 
          badges: badgesWithEarnedStatus || [],
          user_badges: userBadges || []
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      badges: badges || [] 
    })

  } catch (error) {
    console.error('Error fetching badges:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
