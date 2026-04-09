/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)/login` | `/(auth)/signup` | `/(auth)/welcome` | `/(tabs)` | `/(tabs)/groups` | `/(tabs)/home` | `/(tabs)/profile` | `/(tabs)/search` | `/_sitemap` | `/connections` | `/groups` | `/home` | `/login` | `/messages` | `/notifications` | `/profile` | `/scores` | `/search` | `/signup` | `/welcome`;
      DynamicRoutes: `/group/${Router.SingleRoutePart<T>}` | `/messages/${Router.SingleRoutePart<T>}` | `/users/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/group/[id]` | `/messages/[id]` | `/users/[id]`;
    }
  }
}
