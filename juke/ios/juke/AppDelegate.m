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
#import "../SpotifyiOS.framework/Headers/SpotifyiOS.h"

@implementation AppDelegate

RCT_EXPORT_MODULE(AppDelegate);

SPTSessionManager *sessionManager;
SPTConfiguration *configuration;
SPTAppRemote *appRemote;
int expiryTime = 0;

static NSString * const spotifyClientID = @"ff19e2ea3546447e916e43dcda51a298";
static NSString * const spotifyRedirectURLString = @"juke://spotify-login-callback";

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.configuration =
  [[SPTConfiguration alloc] initWithClientID:spotifyClientID redirectURL:[NSURL URLWithString:spotifyRedirectURLString]];
  self.configuration.tokenSwapURL = [NSURL URLWithString: @"http://harrys-macbook-pro.local:3000/swap"];
  self.configuration.tokenRefreshURL = [NSURL URLWithString: @"http://harrys-macbook-pro.local:3000/refresh"];
  self.sessionManager = [SPTSessionManager sessionManagerWithConfiguration:self.configuration delegate:self];
  
  
  NSLog(@"AppDelegate main application method called :O");
//  NSURL *jsCodeLocation;

//  jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];


  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"juke"
                                            initialProperties:nil];
  
//  NSURL *jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
//
//
//  RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
//                                               moduleName:@"juke"
//                                               initialProperties:nil
//                                               launchOptions:launchOptions];

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




- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  NSLog(@"AppDelegate application method called.");
  [self.sessionManager application:app openURL:url options:options];
  return YES;
}

#pragma mark - SPTSessionManagerDelegate

- (void)sessionManager:(SPTSessionManager *)manager didInitiateSession:(SPTSession *)session
{
  NSLog(@"success: %@", session);
  
  
  self.appRemote.delegate = self;
  
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

#pragma mark - SPTAppRemoteDelegate

- (void)appRemote:(SPTAppRemote *)appRemote didDisconnectWithError:(NSError *)error
{
  NSLog(@"disconnected: %@", error);
}

- (void)appRemote:(SPTAppRemote *)appRemote didFailConnectionAttemptWithError:(NSError *)error
{
  NSLog(@"failed: %@", error);
}

- (void)appRemoteDidEstablishConnection:(SPTAppRemote *)appRemote
{
  // Connection was successful, you can begin issuing commands
  NSLog(@"appRemote did establish connection");
  self.appRemote.playerAPI.delegate = self;
  [self.appRemote.playerAPI subscribeToPlayerState:^(id _Nullable result, NSError * _Nullable error) {
    if (error) {
      NSLog(@"appRemote error while subscribing to player state: %@", error.localizedDescription);
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
    self.appRemote.delegate = self;
    [self.appRemote connect];
    NSLog(@"Application became active and the access token was set so the appRemote attempted to connect.");
  } else {
    NSLog(@"Application became active and the access token was not set so the appRemote did not connect.");
  }
}



- (BOOL) invokeAuthModal {
  NSLog(@"auth entered");
  SPTScope scope = SPTUserFollowReadScope | SPTAppRemoteControlScope | SPTPlaylistReadCollaborativeScope | SPTUserLibraryReadScope | SPTUserTopReadScope | SPTStreamingScope | SPTUserModifyPlaybackStateScope | SPTUserReadCurrentlyPlayingScope;

  
  self.appRemote = [[SPTAppRemote alloc] initWithConfiguration:self.configuration logLevel:SPTAppRemoteLogLevelDebug];
  
  if (@available(iOS 11, *)) {
      // Use this on iOS 11 and above to take advantage of SFAuthenticationSession
      [self.sessionManager initiateSessionWithScope:scope options:SPTDefaultAuthorizationOption];
  } else {
      // Use this on iOS versions < 11 to use SFSafariViewController
      [self.sessionManager initiateSessionWithScope:scope options:SPTDefaultAuthorizationOption presentingViewController:self];
  }
  
//  if ([self.appRemote authorizeAndPlayURI:@""]) {
//    //Spotify app is ready for authorisation
//    if (@available(iOS 11, *)) {
//        // Use this on iOS 11 and above to take advantage of SFAuthenticationSession
//        [self.sessionManager initiateSessionWithScope:scope options:SPTDefaultAuthorizationOption];
//    } else {
//        // Use this on iOS versions < 11 to use SFSafariViewController
//        [self.sessionManager initiateSessionWithScope:scope options:SPTDefaultAuthorizationOption presentingViewController:self];
//    }
//  } else {
//    NSLog(@"Failed at authorizaAndPlayURI");
//  }
  
  
  
  return YES;
  
}

- (NSDictionary *)httpPostRequest:(NSString *)url {
  // HTTP POST request code taken from https://stackoverflow.com/a/39848904
  
  NSMutableURLRequest *urlRequest = [[NSMutableURLRequest alloc] initWithURL:[NSURL URLWithString:url]];
  

  NSString *userUpdate =[NSString stringWithFormat:@"access_token=%@", self.sessionManager.session.accessToken];
  

  //create the Method "GET" or "POST"
  [urlRequest setHTTPMethod:@"POST"];

  //Convert the String to Data
  NSData *data1 = [userUpdate dataUsingEncoding:NSUTF8StringEncoding];

  //Apply the data to the body
  [urlRequest setHTTPBody:data1];

  NSURLSession *session = [NSURLSession sharedSession];
  
  __block NSMutableDictionary *responseDictionary = [[NSMutableDictionary alloc] init];
  dispatch_semaphore_t sema = dispatch_semaphore_create(0);
  
  
  NSURLSessionDataTask *dataTask = [session dataTaskWithRequest:urlRequest completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
      NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
      if(httpResponse.statusCode == 200) {
          NSError *parseError = nil;
          responseDictionary = [NSJSONSerialization JSONObjectWithData:data options:0 error:&parseError];
          NSLog(@"The response is - %@",responseDictionary);
          NSInteger success = [[responseDictionary objectForKey:@"success"] integerValue];
      } else {
          NSLog(@"Error at POST request");
        NSLog(@"Status code: %ld", (long)[httpResponse statusCode]);
        NSLog(@"Header fields: %@", [httpResponse allHeaderFields]);
      }
    dispatch_semaphore_signal(sema);
  }];
  [dataTask resume];
  dispatch_semaphore_wait(sema, DISPATCH_TIME_FOREVER);
  return responseDictionary;
}


- (BOOL)getPlaylists {
  if (self.appRemote.isConnected) {
    
    NSLog(@"Attempting to get playlists and appRemote is connected...");
    if ([self httpPostRequest:@"http://harrys-macbook-pro.local:3000/get_playlists"]) {
      return YES;
    } else {
      return NO;
    }
//    dispatch_semaphore_t sema = dispatch_semaphore_create(0);
//    __block NSMutableArray *contentItems = [[NSMutableArray alloc] init];
//
//    [self.appRemote.contentAPI fetchRootContentItemsForType:SPTAppRemoteContentTypeDefault callback:^(id _Nullable result, NSError * _Nullable error) {
//      if (error) {
//        NSLog(@"Error retrieving Root Content Items: %@", error.localizedDescription);
//      } else {
//        NSLog(@"Fetched root content items");
//
//        for (id container in result) {
//          if ([[container valueForKey:@"title"] isEqual: @"Your Library"]) {
//            [self.appRemote.contentAPI fetchChildrenOfContentItem:container callback:^(id  _Nullable result, NSError * _Nullable error) {
//              NSLog(@"Scanning Your Library...");
//              for (id container in result) {
//                if ([[container valueForKey:@"URI"] isEqual:@"spotify:playlists"]) {
//                  [self.appRemote.contentAPI fetchChildrenOfContentItem:container callback:^(id  _Nullable result, NSError * _Nullable error) {
//                    for (id playlist in result) {
//                      [contentItems addObject:[playlist valueForKey:@"title"]];
//                    }
//                    dispatch_semaphore_signal(sema);
//                  }];
//                }
//              }
//            }];
//          }
//        }
//      }
//    }];
//    dispatch_semaphore_wait(sema, DISPATCH_TIME_FOREVER);
//    NSLog(@"Finished retrieving root content items.");
    
//    return contentItems;
  } else {
    NSLog(@"Attempted to get playlists but appRemote was not connected.");
    return NO;
  }
}

- (BOOL) playURI:(NSString *)uri {
  if (self.appRemote.isConnected) {
    NSLog(@"appRemote is connected and playURI called so attempting to play track...");
  } else {
    NSLog(@"appRemote is not connected and playURI called so attempting to connect appRemote then play track...");
    self.appRemote.delegate = self;
    [self.appRemote connect];
  }
  __block bool success = NO;
  self.appRemote.playerAPI.delegate = self;
  [self.appRemote.playerAPI play:uri callback:^(id  _Nullable result, NSError * _Nullable error) {
    if (error) {
      NSLog(@"Error on play callback... %@", error.localizedDescription);
    } else {
      NSLog(@"Success on play callback...");
      success = YES;
    }
  }];
  return success;
  
}

- (BOOL)connectAppRemote {
  NSLog(@"Attempting to connect app Remote in connectAppRemote...");
  NSLog(@"Access token: %@", self.sessionManager.session.accessToken);
  if (self.appRemote.isConnected) {
    NSLog(@"appRemote is already connected, no need to connect again");
  } else {
    self.appRemote.delegate = self;
    [self.appRemote connect];
  }
  return self.appRemote.isConnected;
}

@end
