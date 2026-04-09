# App Privacy Draft

Use this as a starting point for the App Privacy questionnaire in App Store Connect for [`mobile-app`](/Users/lukerestall/Documents/GitHub/pleaseplease/mobile-app).

This is not legal advice. It is a product/engineering draft to speed up App Store Connect setup.

## Data likely collected

### Contact Info
- Email address

Reason:
- Account creation
- Sign in
- Support/account access

### User Content
- Profile information
- Tee times
- Group posts
- Messages
- Scores/round logs
- Images uploaded by the user

Reason:
- Core app functionality

### Identifiers
- User ID / account identifiers

Reason:
- Account linking
- Social features
- Notifications

### Location
- Approximate or user-provided location
- Potential device location when weather/local discovery is used

Reason:
- Nearby golf weather
- Local groups / golf discovery

### Diagnostics / Usage
- Crash / runtime diagnostics if enabled through platform tooling

Reason:
- App stability

## Data not intended for tracking

- No ad tracking flow is currently designed
- No cross-app third-party advertising tracking is intended

## Data linked to the user

Likely yes for:
- account info
- profile
- connections
- messages
- tee times
- groups
- scores

## Sensitive areas to confirm before submission

1. Whether precise device location is ever stored vs only used transiently
2. Whether any analytics SDKs or crash SDKs are added before release
3. Whether push notification tokens are stored before TestFlight/launch
4. Whether message content needs any additional disclosure based on final implementation

## Supporting URLs

- Privacy policy: [https://www.ultimategolfcommunity.com/privacy](https://www.ultimategolfcommunity.com/privacy)
- Support: [https://www.ultimategolfcommunity.com](https://www.ultimategolfcommunity.com)
