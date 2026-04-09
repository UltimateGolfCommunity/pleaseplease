# App Store Readiness

This Expo app lives in [`mobile-app`](/Users/lukerestall/Documents/GitHub/pleaseplease/mobile-app) and is intentionally separate from the web app.

## Current status

- Native auth shell exists
- Email/password auth is wired
- Google and Apple sign-in UI is scaffolded
- Home, groups, group detail, public user, and profile screens are connected
- Tee time posting and group creation are wired to the existing backend
- TypeScript currently passes with `npx tsc --noEmit`

## Still required before TestFlight

1. Add real values in [`.env`](/Users/lukerestall/Documents/GitHub/pleaseplease/mobile-app/.env) for:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_SITE_URL`
   - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
   - `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
   - `EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID`

2. Finish Supabase native social auth configuration:
   - Google provider enabled
   - Apple provider enabled
   - correct mobile bundle identifiers configured

3. Replace placeholder branding assets with real app assets:
   - app icon
   - splash image
   - App Store screenshots

4. Build and test on device:
   - sign in
   - sign up
   - Google auth
   - Apple auth
   - tee time creation
   - group creation
   - share/add-me flow

5. Add remaining App Store expected features:
   - profile photo upload
   - inbox/messages
   - push notifications
   - account deletion path if required by your auth policy

## EAS build path

Use [eas.json](/Users/lukerestall/Documents/GitHub/pleaseplease/mobile-app/eas.json) for:

- development
- preview
- production

Typical path:

```bash
cd mobile-app
npm install
npx expo login
npx eas build --platform ios --profile preview
```

## Notes

- The web app has not been modified by this mobile work.
- Right now `mobile-app/` is still uncommitted.
