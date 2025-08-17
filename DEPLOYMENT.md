# 🚀 UGC Real - Next.js Deployment Guide

## 📋 **Pre-Deployment Checklist**

- [ ] All code is committed to GitHub
- [ ] Environment variables are ready
- [ ] Project builds locally (`npm run build`)
- [ ] Next.js app directory structure is correct
- [ ] All API routes are properly configured

## 🌐 **Vercel Deployment (Recommended for Next.js)**

### **Step 1: Connect GitHub Repository**

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign in with GitHub**
3. **Click "New Project"**
4. **Import your repository:**
   - Select your `ugc-real` repository
   - Vercel will auto-detect it's a Next.js project

### **Step 2: Configure Project Settings**

**Framework Preset**: Next.js (auto-detected)
**Root Directory**: Leave empty (important!)
**Build Command**: `npm run build`
**Output Directory**: `.next`
**Install Command**: `npm install`

### **Step 3: Set Environment Variables**

**Required Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### **Step 4: Deploy**

1. **Click "Deploy"**
2. **Wait for build completion**
3. **Your Next.js app is live!** 🎉

## 🔧 **Environment Variables Setup**

### **Local Development**
```bash
# Copy environment file
cp .env.example .env.local

# Edit with your values
nano .env.local
```

### **Vercel Dashboard**
1. Go to your project in Vercel
2. Click "Settings" → "Environment Variables"
3. Add each variable:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Redeploy after adding variables

## 🚨 **Common Next.js Deployment Issues & Solutions**

### **Build Failures**

**Error: "Module not found"**
```bash
# Solution: Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Error: "TypeScript compilation failed"**
```bash
# Solution: Fix type errors
npm run lint
npm run build
```

**Error: "Environment variables not found"**
- Check all variables are set in Vercel dashboard
- Ensure variable names match exactly
- Redeploy after adding variables

### **404 Errors (Most Common Issue)**

**Problem**: App deploys but shows 404
**Solutions**:
1. **Check Root Directory**: Ensure it's empty (not set to a subfolder)
2. **Verify Build Output**: Should be `.next` folder
3. **Check Framework**: Must be set to "Next.js"
4. **Verify App Directory**: Ensure `app/` folder exists
5. **Rebuild**: Try redeploying after clearing cache

### **Next.js Specific Issues**

**Error: "App directory not found"**
- Ensure you have `app/` directory (not `pages/`)
- Check for `app/layout.tsx` and `app/page.tsx`

**Error: "API routes not working"**
- Verify API routes are in `app/api/` directory
- Check route handlers are properly exported

**Error: "Client components not rendering"**
- Ensure `'use client'` directive is used where needed
- Check for proper component imports

## 📱 **Post-Deployment Testing**

### **1. Test All Next.js Features**
- [ ] Homepage loads correctly (`/`)
- [ ] App Router navigation works
- [ ] API routes respond (`/api/*`)
- [ ] Dynamic routes work (`/users/[id]`)
- [ ] Authentication flows work
- [ ] Dashboard loads (`/dashboard`)

### **2. Performance Check**
- [ ] Page load times acceptable
- [ ] Images optimize correctly
- [ ] Mobile responsiveness works
- [ ] No major performance issues
- [ ] Core Web Vitals are good

## 📊 **Vercel Dashboard Features for Next.js**

### **Analytics**
- **Performance Metrics**: Core Web Vitals
- **Function Execution**: API route performance
- **Error Tracking**: Runtime errors and logs
- **Deployment History**: Build status and logs

### **Monitoring**
- **Real-time Logs**: Live application logs
- **Function Metrics**: API performance data
- **Error Alerts**: Automatic error notifications

## 🔒 **Security Best Practices for Next.js**

### **Environment Variables**
- Never commit `.env.local` to Git
- Use Vercel's encrypted environment variables
- Rotate API keys regularly

### **API Security**
- Validate all inputs in API routes
- Use HTTPS everywhere
- Monitor for suspicious activity
- Implement proper CORS policies

### **Next.js Security Headers**
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}
```

## 🆘 **Troubleshooting 404 Errors**

### **Most Common Causes**

1. **Wrong Root Directory**
   - Set to empty (not a subfolder)
   - Vercel should auto-detect Next.js

2. **Build Output Mismatch**
   - Output directory must be `.next`
   - Build command must be `npm run build`

3. **Framework Detection Issues**
   - Force framework to "Next.js"
   - Clear build cache and redeploy

4. **Missing Dependencies**
   - Ensure all dependencies in package.json
   - Check for missing peer dependencies

5. **App Directory Issues**
   - Ensure `app/` directory exists
   - Check for `app/layout.tsx` and `app/page.tsx`

### **Debug Steps**

1. **Check Build Logs**
   - Look for build errors
   - Verify output directory creation

2. **Verify File Structure**
   - Ensure `app/` directory exists
   - Check for `next.config.ts`

3. **Test Local Build**
   ```bash
   npm run build
   # Should create .next folder
   ```

4. **Clear and Redeploy**
   - Clear Vercel build cache
   - Force new deployment

## 🎯 **Quick Deploy Commands**

```bash
# Test local build
npm run build

# Deploy to Vercel (if using Vercel CLI)
vercel --prod

# Check deployment status
vercel ls
```

## 📁 **Next.js Project Structure Verification**

Ensure your project has this structure:
```
UGCreal/
├── app/                    # ✅ App directory (Next.js 13+)
│   ├── layout.tsx         # ✅ Root layout
│   ├── page.tsx           # ✅ Homepage
│   ├── globals.css        # ✅ Global styles
│   ├── api/               # ✅ API routes
│   └── [other-pages]/     # ✅ Other pages
├── package.json           # ✅ Dependencies
├── next.config.ts         # ✅ Next.js config
├── tsconfig.json          # ✅ TypeScript config
└── tailwind.config.js     # ✅ Tailwind config
```

---

## 🎉 **Deployment Complete!**

**Your UGC Real Next.js app is now live on Vercel!** 🏌️‍♂️⭐

### **Next Steps:**
1. **Monitor** performance and errors
2. **Gather** user feedback
3. **Iterate** and improve features
4. **Scale** as user base grows

### **Your Next.js App is Now:**
- ✅ **Deployed** on Vercel
- ✅ **Connected** to Supabase
- ✅ **Secure** with environment variables
- ✅ **Monitored** with Vercel analytics
- ✅ **Ready** for users worldwide!

**Congratulations on launching UGC Real!** 🎊🏆
