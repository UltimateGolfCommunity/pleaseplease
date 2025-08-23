# 🚀 Supabase Integration Setup Guide

## 📋 **Prerequisites**
- A Supabase account ([sign up here](https://supabase.com))
- Your Supabase project created

## 🔑 **Step 1: Get Your Supabase Credentials**

1. **Go to your Supabase Dashboard**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to API Settings**
   - Go to **Settings** → **API**
   - Copy the following values:
     - **Project URL** (e.g., `https://abcdefghijklmnop.supabase.co`)
     - **anon public** key (starts with `eyJ...`)

## ⚙️ **Step 2: Update Environment Variables**

1. **Edit your `.env.local` file**
   ```bash
   # Replace the placeholder values with your actual credentials
   NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Restart your development server**
   ```bash
   npm run dev
   ```

## 🗄️ **Step 3: Set Up Database Schema**

1. **Open Supabase SQL Editor**
   - In your Supabase dashboard, go to **SQL Editor**
   - Click **New Query**

2. **Run the Schema Script**
   - Copy the contents of `supabase-schema.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute

3. **Verify Tables Created**
   - Go to **Table Editor** in your dashboard
   - You should see all the tables created:
     - `user_profiles`
     - `badges`
     - `user_badges`
     - `user_achievements`
     - `golf_courses`
     - `tee_times`
     - `tee_time_applications`
     - `golf_groups`
     - `group_members`
     - `group_messages`

## 🔐 **Step 4: Configure Authentication**

1. **Enable Email Auth**
   - Go to **Authentication** → **Providers**
   - Ensure **Email** is enabled
   - Configure email templates if desired

2. **Set Up Email Confirmation (Optional)**
   - In **Authentication** → **Settings**
   - Enable **Confirm email** if you want email verification
   - Configure SMTP settings for custom emails

3. **Configure Redirect URLs**
   - Add these URLs to **Authentication** → **URL Configuration**:
     ```
     Site URL: http://localhost:3001
     Redirect URLs: 
       http://localhost:3001/auth/callback
       http://localhost:3001/dashboard
     ```

## 🧪 **Step 5: Test the Integration**

1. **Test Sign Up**
   - Go to `http://localhost:3001/auth/signup`
   - Create a new account
   - Check your Supabase dashboard for the new user

2. **Test Sign In**
   - Go to `http://localhost:3001/auth/login`
   - Sign in with your credentials
   - You should be redirected to the dashboard

3. **Check Database**
   - In Supabase **Table Editor**
   - Check `user_profiles` table for your profile
   - Check `auth.users` table for authentication data

## 🔧 **Step 6: Troubleshooting**

### **Common Issues:**

1. **"Invalid URL" Error**
   - Ensure your `NEXT_PUBLIC_SUPABASE_URL` doesn't have trailing slashes
   - Format: `https://project-id.supabase.co`

2. **"Invalid API Key" Error**
   - Use the **anon public** key, not the service role key
   - Key should start with `eyJ...`

3. **CORS Errors**
   - Add your localhost URL to Supabase **Settings** → **API** → **CORS**

4. **Authentication Redirect Issues**
   - Check your redirect URLs in Supabase **Authentication** → **URL Configuration**

### **Debug Steps:**
1. **Check Browser Console** for error messages
2. **Verify Environment Variables** are loaded correctly
3. **Check Supabase Logs** in your dashboard
4. **Ensure Database Schema** is properly set up

## 📱 **Step 7: Production Deployment**

When deploying to production:

1. **Update Environment Variables**
   - Set production Supabase credentials
   - Update redirect URLs to your production domain

2. **Configure CORS**
   - Add your production domain to Supabase CORS settings

3. **Set Up Custom Domain (Optional)**
   - Configure custom domain in Supabase **Settings** → **General**

## 🎯 **What You Get After Setup:**

✅ **User Authentication**: Sign up, sign in, sign out  
✅ **User Profiles**: Complete user profile management  
✅ **Badge System**: Achievement and milestone tracking  
✅ **Tee Time Management**: Create and manage golf bookings  
✅ **Group System**: Golf group creation and management  
✅ **Real-time Updates**: Live data synchronization  
✅ **Row Level Security**: Secure data access  
✅ **Email Integration**: User notifications and confirmations  

## 🚀 **Next Steps:**

1. **Customize Email Templates** in Supabase
2. **Add Social Auth** (Google, GitHub, etc.)
3. **Set Up Webhooks** for external integrations
4. **Configure Storage** for user avatars and course images
5. **Add Analytics** and monitoring

---

## 📞 **Need Help?**

- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **Supabase Discord**: [https://discord.supabase.com](https://discord.supabase.com)
- **GitHub Issues**: Check the project repository

Your golf community app will now have full Supabase integration with real-time authentication, database, and security! 🏌️‍♂️✨
