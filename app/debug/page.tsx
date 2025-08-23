'use client'

export default function DebugPage() {
  const handleCheckConfig = () => {
    console.log('🔍 Environment Variables Check:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY prefix:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20))
    
    // Test URL validation
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (url) {
      try {
        const urlObj = new URL(url)
        console.log('URL Protocol:', urlObj.protocol)
        console.log('URL Hostname:', urlObj.hostname)
        console.log('Is PostgreSQL URL:', urlObj.protocol === 'postgresql:' || urlObj.protocol === 'postgres:')
        console.log('Is HTTPS:', urlObj.protocol === 'https:')
      } catch (error) {
        console.error('URL Parse Error:', error)
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔧 Debug Configuration</h1>
        
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-2 text-sm font-mono">
            <div>
              <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>
              <br />
              <span className="text-blue-600 dark:text-blue-400">
                {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}
              </span>
            </div>
            <div>
              <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>
              <br />
              <span className="text-green-600 dark:text-green-400">
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 30)}...` 
                  : 'Not set'
                }
              </span>
            </div>
          </div>
          
          <button 
            onClick={handleCheckConfig}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Check Configuration (Console)
          </button>
        </div>

        <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            ⚠️ Debug Instructions
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
            <li>Check the environment variables above</li>
            <li>Click "Check Configuration" and view browser console</li>
            <li>Look for any errors or placeholder values</li>
            <li>Verify the URL uses https:// and not postgresql://</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
