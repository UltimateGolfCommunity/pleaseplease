#import "AppDelegate.h"

#if __has_include(<ExpoModulesCore/ExpoModulesCore-Swift.h>)
#import <ExpoModulesCore/ExpoModulesCore-Swift.h>
#else
#import "ExpoModulesCore-Swift.h"
#endif

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"main";
  self.initialProps = @{};
  self.dependencyProvider = [RCTAppDependencyProvider new];

  [ExpoAppDelegateSubscriberManager application:application willFinishLaunchingWithOptions:launchOptions];
  [super application:application didFinishLaunchingWithOptions:launchOptions];
  [ExpoAppDelegateSubscriberManager application:application didFinishLaunchingWithOptions:launchOptions];
  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@".expo/.virtual-metro-entry"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (void)customizeRootView:(RCTRootView *)rootView
{
  [super customizeRootView:rootView];

  for (id<EXAppDelegateSubscriberProtocol> subscriber in [EXExpoAppDelegateSubscriberRepository subscribers]) {
    if ([subscriber respondsToSelector:@selector(customizeRootView:)]) {
      [subscriber customizeRootView:rootView];
    }
  }
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options
{
  BOOL expoHandled = [ExpoAppDelegateSubscriberManager application:application open:url options:options];
  BOOL reactHandled = [RCTLinkingManager application:application openURL:url options:options];
  return expoHandled || reactHandled;
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
  BOOL expoHandled = [ExpoAppDelegateSubscriberManager application:application continue:userActivity restorationHandler:restorationHandler];
  BOOL reactHandled = [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
  return expoHandled || reactHandled;
}

- (void)applicationDidBecomeActive:(UIApplication *)application
{
  [ExpoAppDelegateSubscriberManager applicationDidBecomeActive:application];
}

- (void)applicationWillResignActive:(UIApplication *)application
{
  [ExpoAppDelegateSubscriberManager applicationWillResignActive:application];
}

- (void)applicationDidEnterBackground:(UIApplication *)application
{
  [ExpoAppDelegateSubscriberManager applicationDidEnterBackground:application];
}

- (void)applicationWillEnterForeground:(UIApplication *)application
{
  [ExpoAppDelegateSubscriberManager applicationWillEnterForeground:application];
}

- (void)applicationWillTerminate:(UIApplication *)application
{
  [ExpoAppDelegateSubscriberManager applicationWillTerminate:application];
}

- (void)applicationDidReceiveMemoryWarning:(UIApplication *)application
{
  [ExpoAppDelegateSubscriberManager applicationDidReceiveMemoryWarning:application];
}

- (void)application:(UIApplication *)application handleEventsForBackgroundURLSession:(NSString *)identifier completionHandler:(void (^)(void))completionHandler
{
  [ExpoAppDelegateSubscriberManager application:application handleEventsForBackgroundURLSession:identifier completionHandler:completionHandler];
}

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  [ExpoAppDelegateSubscriberManager application:application didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  [ExpoAppDelegateSubscriberManager application:application didFailToRegisterForRemoteNotificationsWithError:error];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [ExpoAppDelegateSubscriberManager application:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [ExpoAppDelegateSubscriberManager application:application performFetchWithCompletionHandler:completionHandler];
}

@end
