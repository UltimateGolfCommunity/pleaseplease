# 🏌️‍♂️ UGC Real - Ultimate Golf Community

A modern, social golf platform built with **Next.js 13+**, Supabase, and Tailwind CSS.

## ✨ **Features**

- **🏆 Badge System** - Golf achievements and milestones
- **⛳ Tee Time Management** - Post and join open tee times  
- **👥 Golf Groups** - Create and manage golf communities
- **💬 Real-time Messaging** - Connect with other golfers
- **📊 Achievement Tracking** - Monitor your golf progress
- **🌤️ Weather Integration** - Current conditions for your location
- **🏌️‍♂️ Golf Round Recording** - Track scores and statistics
- **⭐ Course Reviews** - Rate and review golf courses

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Supabase account

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ugc-real.git
   cd ugc-real
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 **Deployment**

### **Vercel (Recommended)**

1. **Connect your GitHub repository**
2. **Set environment variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Deploy!**

## 🏗️ **Project Structure**

```
UGCreal/
├── app/                    # Next.js 13+ app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── profile/           # User profile
│   └── users/             # User discovery
├── components/            # Reusable components
├── contexts/              # React contexts
├── lib/                   # Utility functions
└── public/                # Static assets
```

## 🎨 **Tech Stack**

- **Frontend**: Next.js 13+, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## 🔧 **Development**

### **Available Scripts**

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### **Key Technologies**

- **Next.js 13+**: App Router, Server Components, API Routes
- **TypeScript**: Type safety and better developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **Supabase**: Backend-as-a-Service with PostgreSQL

---

**Built with ❤️ for the golf community**

*Connect, Play, Improve* ⛳🏆
# Force deployment Mon Sep  1 19:48:06 CDT 2025
# Trigger deployment for logo fixes
# Force Vercel deployment - Tue Sep 16 12:31:31 CDT 2025
