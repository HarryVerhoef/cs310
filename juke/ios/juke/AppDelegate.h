/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridgeDelegate.h>
#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>
#import "../SpotifyiOS.framework/Headers/SPTSessionManager.h"
#import "../SpotifyiOS.framework/Headers/SpotifyiOS.h"

@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate, SPTSessionManagerDelegate, SPTAppRemoteDelegate, SPTAppRemotePlayerStateDelegate, RCTBridgeModule>


@property (nonatomic, strong) UIWindow *window;

@property (nonatomic, strong) SPTAppRemote *appRemote;
@property (nonatomic, strong) SPTSessionManager *sessionManager;
@property (nonatomic, strong) SPTConfiguration *configuration;

- (void)initConfigure;
- (void)configureConfigure;
- (void)invokeAuthModal;
- (void)initAppRemote;
- (void)resume:(RCTResponseSenderBlock)jsCallback;
- (BOOL)isSpotifyInstalled;
@end
