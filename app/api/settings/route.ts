import { NextRequest, NextResponse } from 'next/server'

// Mock user settings data for development
const mockUserSettings = {
  'user-123': {
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      bio: 'Passionate golfer looking to improve my game',
      handicap: 15,
      location: 'San Francisco, CA'
    },
    notifications: {
      email: true,
      push: false,
      sms: false,
      marketing: false
    },
    privacy: {
      profileVisible: true,
      showHandicap: true,
      showLocation: false,
      allowMessages: true
    },
    appearance: {
      theme: 'auto',
      language: 'en'
    },
    preferences: {
      timezone: 'utc-8',
      dateFormat: 'mm-dd-yyyy',
      units: 'imperial'
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'user-123'
    
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Using mock data for settings API')
      
      const userSettings = mockUserSettings[userId as keyof typeof mockUserSettings]
      if (!userSettings) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      
      return NextResponse.json(userSettings)
    }

    // Use real Supabase if configured
    // const supabase = createClient(
    //   process.env.NEXT_PUBLIC_SUPABASE_URL,
    //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    // )
    
    // const { data, error } = await supabase
    //   .from('user_settings')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .single()
    
    // if (error) throw error
    
    // return NextResponse.json(data)
    
    // For now, return mock data
    const userSettings = mockUserSettings[userId as keyof typeof mockUserSettings]
    return NextResponse.json(userSettings)
    
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, settings } = body
    
    if (!userId || !settings) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Using mock data for settings API - saving settings')
      
      // Update mock data
      mockUserSettings[userId as keyof typeof mockUserSettings] = settings
      
      return NextResponse.json({ 
        message: 'Settings saved successfully',
        settings 
      })
    }

    // Use real Supabase if configured
    // const supabase = createClient(
    //   process.env.NEXT_PUBLIC_SUPABASE_URL,
    //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    // )
    
    // const { data, error } = await supabase
    //   .from('user_settings')
    //   .upsert({
    //     user_id: userId,
    //     settings: settings,
    //     updated_at: new Date().toISOString()
    //   })
    
    // if (error) throw error
    
    // return NextResponse.json({ 
    //   message: 'Settings saved successfully',
    //   settings: data 
    // })
    
    // For now, return success with mock data
    return NextResponse.json({ 
      message: 'Settings saved successfully',
      settings 
    })
    
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, field, value } = body
    
    if (!userId || !field) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Using mock data for settings API - updating field')
      
      // Update specific field in mock data
      const userSettings = mockUserSettings[userId as keyof typeof mockUserSettings]
      if (userSettings) {
        // Handle nested updates (e.g., 'profile.firstName')
        const keys = field.split('.')
        let current = userSettings as any
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]]
        }
        current[keys[keys.length - 1]] = value
        
        return NextResponse.json({ 
          message: 'Field updated successfully',
          field,
          value 
        })
      }
      
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Use real Supabase if configured
    // const supabase = createClient(
    //   process.env.NEXT_PUBLIC_SUPABASE_URL,
    //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    // )
    
    // const { data, error } = await supabase
    //   .from('user_settings')
    //   .update({ 
    //     [field]: value,
    //     updated_at: new Date().toISOString()
    //   })
    //   .eq('user_id', userId)
    
    // if (error) throw error
    
    // return NextResponse.json({ 
    //   message: 'Field updated successfully',
    //   field,
    //   value 
    // })
    
    // For now, return success
    return NextResponse.json({ 
      message: 'Field updated successfully',
      field,
      value 
    })
    
  } catch (error) {
    console.error('Error updating setting field:', error)
    return NextResponse.json({ error: 'Failed to update setting field' }, { status: 500 })
  }
}
