# TestFlight Runbook

Use this when the app is ready for the first iOS preview/TestFlight pass.

## Before building

1. Confirm [`.env`](/Users/lukerestall/Documents/GitHub/pleaseplease/mobile-app/.env) has real values
2. Confirm App Store Connect app exists for:
   - `com.ultimategolfcommunity.app`
3. Confirm `ascAppId` in [`eas.json`](/Users/lukerestall/Documents/GitHub/pleaseplease/mobile-app/eas.json) is set
4. Confirm sign-in providers are configured
5. Confirm the latest app icon/splash assets are final enough for testing

## Build commands

```bash
cd mobile-app
npm install
npm run build:ios:preview
```

## After the build finishes

1. Install on a real iPhone through TestFlight or internal distribution
2. Test these flows:
   - sign in
   - sign up
   - session restore after cold launch
   - home weather
   - tee time creation
   - tee time join flow
   - group creation
   - group editing
   - group logo / cover upload
   - connections add / accept
   - invite connection to group
   - profile save
   - account deletion

## Release blockers to watch for

- auth callback issues
- broken image upload persistence
- stale profile/group data after save
- weather failing silently
- empty or placeholder copy in screenshots
- App Review issues around account deletion/support/privacy

## If preview build is good

1. Capture screenshots from the tested build
2. Review [`APP_STORE_METADATA.md`](/Users/lukerestall/Documents/GitHub/pleaseplease/mobile-app/APP_STORE_METADATA.md)
3. Review [`APP_PRIVACY_DRAFT.md`](/Users/lukerestall/Documents/GitHub/pleaseplease/mobile-app/APP_PRIVACY_DRAFT.md)
4. Run:

```bash
cd mobile-app
npm run build:ios:production
npm run submit:ios:production
```
