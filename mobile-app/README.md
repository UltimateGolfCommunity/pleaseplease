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
See [APP_STORE_METADATA.md](/Users/lukerestall/Documents/GitHub/pleaseplease/mobile-app/APP_STORE_METADATA.md) for listing copy, [SCREENSHOT_PLAN.md](/Users/lukerestall/Documents/GitHub/pleaseplease/mobile-app/SCREENSHOT_PLAN.md) for the first screenshot pass, [APP_PRIVACY_DRAFT.md](/Users/lukerestall/Documents/GitHub/pleaseplease/mobile-app/APP_PRIVACY_DRAFT.md) for App Privacy setup, [TESTFLIGHT_RUNBOOK.md](/Users/lukerestall/Documents/GitHub/pleaseplease/mobile-app/TESTFLIGHT_RUNBOOK.md) for the first real build/test pass, [APP_REVIEW_NOTES.md](/Users/lukerestall/Documents/GitHub/pleaseplease/mobile-app/APP_REVIEW_NOTES.md) for reviewer guidance, and [FIRST_RELEASE_NOTES.md](/Users/lukerestall/Documents/GitHub/pleaseplease/mobile-app/FIRST_RELEASE_NOTES.md) for the first release notes.

## Recommended next steps

1. Fill in the Google client IDs in `.env` and complete Supabase native provider setup
2. Run the first preview/TestFlight build through EAS
3. Test image upload, weather, home course save, and session restore on a real iPhone
4. Capture the first App Store screenshot set
5. Finish App Store Connect listing, privacy answers, and submission details
