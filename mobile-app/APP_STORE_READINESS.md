# App Store Readiness

This Expo app lives in [`mobile-app`](/Users/lukerestall/Documents/GitHub/pleaseplease/mobile-app) and is intentionally separate from the web app.

## Current state

- Native iOS app shell exists and launches in simulator
- Email/password auth is wired
- Home, groups, connections, group detail, public user, and profile screens are connected
- Tee time posting, group creation, group invites, and profile activity are wired to the existing backend
- App icon and splash assets are in place
- `npm run lint` passes
- `npx tsc --noEmit` passes

## Before TestFlight

1. Finalize env values in [`.env`](/Users/lukerestall/Documents/GitHub/pleaseplease/mobile-app/.env):
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_SITE_URL`
   - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
   - `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
   - `EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID`

2. Finish auth provider setup:
   - Google OAuth fully configured for mobile bundle id `com.ultimategolfcommunity.app`
   - Apple Sign In enabled in Apple Developer and Supabase
   - callback URLs verified for native auth

3. Finish product reliability:
   - verify profile photo and cover persistence
   - verify group logo and cover persistence
   - verify home course save
   - verify weather on mobile
   - verify sign in restores session after cold launch

4. Complete App Store compliance:
   - Privacy Policy live at production URL
   - Support URL live
   - account deletion path available if required for this auth model
   - App Privacy answers prepared
   - export compliance/encryption answers prepared

5. Prepare store assets:
   - iPhone screenshots
   - subtitle, keywords, marketing copy
   - app category
   - support contact

## Build path

Use [eas.json](/Users/lukerestall/Documents/GitHub/pleaseplease/mobile-app/eas.json) profiles:

- `development`
- `preview`
- `production`

Scripts now available in [package.json](/Users/lukerestall/Documents/GitHub/pleaseplease/mobile-app/package.json):

```bash
cd mobile-app
npm install
npm run build:ios:preview
npm run build:ios:production
npm run submit:ios:production
```

## App Store Connect setup

1. Create the iOS app in App Store Connect using bundle id:
   - `com.ultimategolfcommunity.app`

2. Once the App Store Connect app exists, replace the placeholder in [eas.json](/Users/lukerestall/Documents/GitHub/pleaseplease/mobile-app/eas.json):
   - `SET_IN_EAS_WHEN_APP_STORE_CONNECT_APP_EXISTS`

3. Build a preview/TestFlight binary first.

4. Test on a real iPhone before production submission:
   - sign in
   - sign up
   - tee time post/join
   - group create/edit/invite
   - connections add/accept
   - profile edits
   - image upload

## Repo notes

- The web app is separate from this mobile app work.
- The fastest route to the App Store is:
  - finish the last broken flows
  - do one TestFlight build
  - test on device
  - submit after that
