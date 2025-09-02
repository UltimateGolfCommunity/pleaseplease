import { NextRequest, NextResponse } from 'next/server'

// Mock user data for testing
const mockUsers = [
  {
    id: 'user-1',
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@example.com',
    username: 'johnsmith',
    handicap: 12,
    location: 'San Francisco, CA',
    bio: 'Weekend warrior who loves the game',
    avatar_url: null
  },
  {
    id: 'user-2',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.j@example.com',
    username: 'sarahj',
    handicap: 8,
    location: 'Los Angeles, CA',
    bio: 'Competitive golfer, always looking to improve',
    avatar_url: null
  },
  {
    id: 'user-3',
    first_name: 'Mike',
    last_name: 'Davis',
    email: 'mike.davis@example.com',
    username: 'mikedavis',
    handicap: 18,
    location: 'Phoenix, AZ',
    bio: 'Just getting back into golf after a long break',
    avatar_url: null
  },
  {
    id: 'user-4',
    first_name: 'Luke',
    last_name: 'Restall',
    email: 'luke.restall@example.com',
    username: 'lukerestall',
    handicap: 15,
    location: 'Toronto, ON',
    bio: 'Passionate golfer looking for new connections',
    avatar_url: null
  }
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  
  console.log('🔍 Test search for:', query)
  console.log('📊 Available users:', mockUsers.map(u => u.first_name + ' ' + u.last_name))
  
  if (!query) {
    return NextResponse.json({ 
      message: 'No query provided',
      users: mockUsers,
      count: mockUsers.length
    })
  }
  
  const filteredUsers = mockUsers.filter(user => 
    user.first_name.toLowerCase().includes(query.toLowerCase()) ||
    user.last_name.toLowerCase().includes(query.toLowerCase()) ||
    user.username.toLowerCase().includes(query.toLowerCase()) ||
    user.location.toLowerCase().includes(query.toLowerCase())
  )
  
  console.log('✅ Search results:', filteredUsers.length)
  
  return NextResponse.json({ 
    query,
    users: filteredUsers,
    count: filteredUsers.length,
    message: `Found ${filteredUsers.length} users matching "${query}"`
  })
}
