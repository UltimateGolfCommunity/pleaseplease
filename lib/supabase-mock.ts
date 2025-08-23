// Mock Supabase client for development
// This bypasses the need for real Supabase credentials during development

export const mockSupabaseClient = {
  auth: {
    getSession: async () => ({
      data: { session: null },
      error: null
    }),
    onAuthStateChange: (callback: any) => ({
      data: { subscription: { unsubscribe: () => {} } }
    }),
    signUp: async (email: string, password: string) => ({
      data: { user: { id: 'mock-user-id', email } },
      error: null
    }),
    signIn: async (email: string, password: string) => ({
      data: { user: { id: 'mock-user-id', email } },
      error: null
    }),
    signOut: async () => ({ error: null })
  },
  from: (table: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: any) => ({
        order: (column: string, options: any) => Promise.resolve({
          data: getMockData(table),
          error: null
        })
      }),
      order: (column: string, options: any) => Promise.resolve({
        data: getMockData(table),
        error: null
      })
    }),
    insert: (data: any) => Promise.resolve({
      data: { id: 'mock-id', ...data },
      error: null
    }),
    update: (data: any) => Promise.resolve({
      data: { id: 'mock-id', ...data },
      error: null
    }),
    delete: () => Promise.resolve({
      data: null,
      error: null
    })
  })
}

function getMockData(table: string) {
  switch (table) {
    case 'badges':
      return [
        {
          id: 'mock-badge-1',
          name: 'First Round',
          description: 'Complete your first golf round',
          icon_name: 'flag',
          category: 'achievement',
          points: 10,
          rarity: 'common'
        },
        {
          id: 'mock-badge-2',
          name: 'Early Adopter',
          description: 'One of the first users',
          icon_name: 'star',
          category: 'early_adopter',
          points: 50,
          rarity: 'rare'
        }
      ]
    case 'user_profiles':
      return [{
        id: 'mock-user-id',
        first_name: 'Mock',
        last_name: 'User',
        email: 'mock@example.com',
        username: 'mockuser',
        handicap: 15,
        total_points: 60
      }]
    case 'user_badges':
      return []
    default:
      return []
  }
}
