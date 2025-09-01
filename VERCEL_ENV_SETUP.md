# Vercel Environment Variables Setup

## 🔧 Setting up the Service Role Key in Vercel

The profile API is now working locally but needs the service role key in production.

### Steps:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your `pleaseplease` project

2. **Navigate to Settings**
   - Click on your project
   - Go to "Settings" tab
   - Click "Environment Variables" in the left sidebar

3. **Add the Service Role Key**
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudW9rZ3NjYXZueXRwcXhsdXJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA5NzIyMywiZXhwIjoyMDcwNjczMjIzfQ.2lWEhixvEMDI6E-IA9e9yN8PN_Vgtow8lemtKeAoZI8`
   - **Environment**: Production, Preview, Development
   - Click "Save"

4. **Redeploy**
   - Go to "Deployments" tab
   - Click "Redeploy" on your latest deployment

### ✅ What This Fixes:

- **Profile Updates**: Users can save their profile information
- **Profile Creation**: New users get profiles created automatically
- **No More 500 Errors**: RLS policy violations are resolved
- **UUID Validation**: Proper error messages for invalid user IDs

### 🔍 Testing:

After deployment, try updating a profile in your app. The 500 error should be gone!

### 📝 Note:

The service role key bypasses Row Level Security (RLS) policies for server-side operations. This is secure because:
- It's only used server-side
- Never exposed to the client
- Only used for profile management operations
