# Supabase Connection Troubleshooting

## Error: `ERR_NAME_NOT_RESOLVED` or `Failed to fetch`

This error indicates that your application cannot connect to your Supabase project. The URL `https://xnuokgscavnytpqxlurg.supabase.co` is not resolving.

## Common Causes & Solutions

### 1. Environment Variables Not Set in Production (Most Common)

**Problem:** Environment variables are set locally but not in Vercel production.

**Solution:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`pleaseplease` or `ultimategolfcommunity`)
3. Go to **Settings** → **Environment Variables**
4. Verify these variables are set for **Production**, **Preview**, and **Development**:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://xnuokgscavnytpqxlurg.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your anon key from Supabase)
   - `SUPABASE_SERVICE_ROLE_KEY` = (your service role key from Supabase)

5. **After adding/updating variables, you MUST redeploy:**
   - Go to **Deployments** tab
   - Click **"..."** on the latest deployment
   - Click **"Redeploy"**

### 2. Supabase Project Paused or Deleted

**Problem:** Your Supabase project might be paused (free tier) or deleted.

**Solution:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Check if your project `xnuokgscavnytpqxlurg` exists and is active
3. If paused, click "Resume" or upgrade your plan
4. If deleted, you'll need to create a new project and update environment variables

### 3. Incorrect Supabase URL

**Problem:** The URL in your environment variables doesn't match your actual Supabase project.

**Solution:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** (should be `https://[project-ref].supabase.co`)
5. Update `NEXT_PUBLIC_SUPABASE_URL` in Vercel with the correct URL

### 4. DNS/Network Issues

**Problem:** Temporary network or DNS resolution issues.

**Solution:**
1. Wait a few minutes and try again
2. Check if you can access `https://xnuokgscavnytpqxlurg.supabase.co` directly in your browser
3. If the URL doesn't load, the project is likely paused or deleted

## Verification Steps

### Check Environment Variables in Production

1. Visit: `https://www.ultimategolfcommunity.com/api/diagnostic`
2. This will show you what environment variables are available in production

### Test Supabase Connection

1. Visit: `https://www.ultimategolfcommunity.com/api/validate-supabase-config`
2. This will validate your Supabase configuration

### Check Supabase Project Status

1. Visit: `https://supabase.com/dashboard/project/xnuokgscavnytpqxlurg`
2. Verify the project is active (not paused)

## Quick Fix Checklist

- [ ] Environment variables set in Vercel (Production, Preview, Development)
- [ ] Variables match your Supabase project exactly
- [ ] Redeployed after setting environment variables
- [ ] Supabase project is active (not paused)
- [ ] URL format is correct: `https://[project-ref].supabase.co` (no trailing slash)
- [ ] Anon key is from Settings → API → Project API keys → `anon` `public`

## Getting Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Still Having Issues?

1. Check browser console for detailed error messages
2. Check Vercel deployment logs for environment variable issues
3. Verify your Supabase project is on an active plan (not paused)
4. Try accessing the Supabase URL directly in your browser to confirm it's reachable
