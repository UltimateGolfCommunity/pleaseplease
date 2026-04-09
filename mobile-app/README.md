# Ultimate Golf Community Mobile

This folder is a separate Expo app scaffold so the existing web app can keep shipping without disruption.

## What is here

- Expo Router app shell
- native auth provider backed by the same Supabase project
- email/password login and signup
- connected home, groups, group detail, and profile screens
- shared golfer profile route for add-me/invite links
- Supabase client setup for mobile
- EAS config for App Store build prep

## Get started

1. Copy `.env.example` to `.env`
2. Add your Supabase URL and anon key
3. Install dependencies

```bash
cd mobile-app
npm install
```

4. Run the app

```bash
npm run dev
```

## App Store path

This is the starting point for:

- native auth
- native group/community flows
- native tee times and messages
- deep links for add-me/profile invites
- push notifications
- App Store submission through EAS

See [APP_STORE_READINESS.md](/Users/lukerestall/Documents/GitHub/pleaseplease/mobile-app/APP_STORE_READINESS.md) for the next concrete build and submission checklist.

## Recommended next steps

1. Fill in the Google client IDs in `.env` and complete Supabase native provider setup
2. Add profile photo upload and image picking
3. Add tee time applications, group messaging, and inbox flows
4. Add push notifications and deeper invite/deep-link flows
5. Configure EAS credentials and production icons/splash assets
