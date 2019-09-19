/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

@implementation AppDelegate

RCT_EXPORT_MODULE(AppDelegate);

SPTSessionManager *sessionManager;
SPTConfiguration *configuration;
SPTAppRemote *appRemote;

static NSString * const spotifyClientID = @"ff19e2ea3546447e916e43dcda51a298";
static NSString * const spotifyRedirectURLString = @"juke://spotify-login-callback";

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  NSLog(@"AppDelegate main application method called :O");
  NSURL *jsCodeLocation;
  
  jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
  
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"juke"
                                            initialProperties:nil];

  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  return YES;
}



- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  NSLog(@"sourceURLForBridge method called :o");
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}


#pragma mark - SPTSessionManagerDelegate

- (void)sessionManager:(SPTSessionManager *)manager didInitiateSession:(SPTSession *)session
{
  NSLog(@"success: %@", session);
  self.appRemote.connectionParameters.accessToken = session.accessToken;
  
  [self.appRemote connect];
}

- (void)sessionManager:(SPTSessionManager *)manager didFailWithError:(NSError *)error
{
  NSLog(@"sessionManager fail: %@", error);
}

- (void)sessionManager:(SPTSessionManager *)manager didRenewSession:(SPTSession *)session
{
  NSLog(@"sessionManager renewed: %@", session);
}


- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  NSLog(@"AppDelegate application method called.");
  [self.sessionManager application:app openURL:url options:options];
  return YES;
}

#pragma mark - SPTAppRemoteDelegate

- (void)appRemote:(SPTAppRemote *)appRemote didDisconnectWithError:(NSError *)error
{
  NSLog(@"disconnected");
}

- (void)appRemote:(SPTAppRemote *)appRemote didFailConnectionAttemptWithError:(NSError *)error
{
  NSLog(@"failed");
}

- (void)appRemoteDidEstablishConnection:(SPTAppRemote *)appRemote
{
  // Connection was successful, you can begin issuing commands
  NSLog(@"appRemote did establish connection");
  self.appRemote.playerAPI.delegate = self;
  [self.appRemote.playerAPI subscribeToPlayerState:^(id _Nullable result, NSError * _Nullable error) {
    if (error) {
      NSLog(@"appRemote error: %@", error.localizedDescription);
    }
  }];
}

- (void)playerStateDidChange:(id<SPTAppRemotePlayerState>)playerState
{
  NSLog(@"Track name: %@", playerState.track.name);
}

- (void)applicationWillResignActive:(UIApplication *)application
{
  if (self.appRemote.isConnected) {
    [self.appRemote disconnect];
    NSLog(@"Application resigned active and appRemote was connected and has attempted to disconnect.");
  } else {
    NSLog(@"Application resigned active and appRemote was not connected.");
  }
}

- (void)applicationDidBecomeActive:(UIApplication *)application
{
  if (self.appRemote.connectionParameters.accessToken) {
    [self.appRemote connect];
    NSLog(@"Application became active and the access token was set so the appRemote attempted to connect.");
  } else {
    NSLog(@"Application became active and the access token was not set so the appRemote did not connect.");
  }
}

- (void) initConfigure {
  NSLog(@"Initialising configuration");
  self.configuration  = [[SPTConfiguration alloc] initWithClientID:spotifyClientID redirectURL:[NSURL URLWithString:spotifyRedirectURLString]];
}

- (void) configureConfigure {
  NSLog(@"configure entered");
  
  self.configuration.tokenSwapURL = [NSURL URLWithString: @"http://harrys-macbook-pro.local:3000/swap"];
  self.configuration.tokenRefreshURL = [NSURL URLWithString: @"http://harrys-macbook-pro.local:3000/refresh"];
  self.configuration.playURI = @"";
  if (!self.refreshSession) {
    self.sessionManager = [[SPTSessionManager alloc] initWithConfiguration:self.configuration delegate:self];
  }
  
  NSLog(@"configure left");
}

- (BOOL) invokeAuthModal {
    NSLog(@"auth entered");
    SPTScope scope = SPTAppRemoteControlScope;
  if (!self.refreshSession) {
    NSLog(@"No need to refresh session");
    if (@available(iOS 11, *)) {
      // Use this on iOS 11 and above to take advantage of SFAuthenticationSession
      [self.sessionManager initiateSessionWithScope:scope options:SPTDefaultAuthorizationOption];
    } else {
      // Use this on iOS versions < 11 to use SFSafariViewController
      [self.sessionManager initiateSessionWithScope:scope options:SPTDefaultAuthorizationOption presentingViewController:self];
    }
    NSLog(@"auth left");
    return YES;
  } else {
    NSLog(@"Refreshed session from within auth...");
    return NO;
  }
  
}

- (void) initAppRemote {
  NSLog(@"Initialising AppRemote...");
  self.appRemote = [[SPTAppRemote alloc] initWithConfiguration:self.configuration logLevel:SPTAppRemoteLogLevelDebug];
  self.appRemote.delegate = self;
}

- (BOOL) refreshSession {
  if (self.appRemote.connectionParameters.accessToken && self.sessionManager.session.isExpired) {
    NSLog(@"Attempting to refresh access token...");
    [self.sessionManager renewSession];
    self.appRemote.connectionParameters.accessToken = self.sessionManager.session.accessToken;
    NSLog(@"Finished attempting to refresh access token.");
    return YES;
  } else {
    return NO;
  }
  
  
  
}

- (void) resume:(RCTResponseSenderBlock)jsCallback {
  NSLog(@"appRemote is connected: %@", self.appRemote.isConnected ? @"YES" : @"NO");
  
  self.appRemote.playerAPI.delegate = self;
  [self.appRemote.playerAPI resume:^(id  _Nullable result, NSError * _Nullable error) {
    NSLog(@"resume callback called");
    if (error) {
      NSLog(@"resume callback error: %@", error.localizedDescription);
    } else {
      NSLog(@"resume callback no error");
      jsCallback(@[[NSNull null], result]);
    }
  }
   ];
}

- (BOOL) isSpotifyInstalled {
  return self.sessionManager.isSpotifyAppInstalled;
}

- (NSArray *)getPlaylists {
  if (self.appRemote.isConnected) {
    
    NSLog(@"Attempting to get playlists and appRemote is connected...");
    __block NSArray *contentItems;
    [self.appRemote.contentAPI fetchRootContentItemsForType:SPTAppRemoteContentTypeDefault callback:^(id  _Nullable result, NSError * _Nullable error) {
      if (error) {
        NSLog(@"Error retrieving Root Content Items: %@", error.localizedDescription);
      } else {
        NSLog(@"returning result");
        contentItems = result;
      }
    }];
    NSLog(@"Finished retrieving root content items.");
    return contentItems;
  } else {
    NSLog(@"Attempted to get playlists but appRemote was not connected.");
    return @[];
  }
}

@end
