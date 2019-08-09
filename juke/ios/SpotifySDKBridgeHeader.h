//
//  SpotifySDKBridgeHeader.h
//  juke
//
//  Created by Harry Verhoef on 09/08/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import "SpotifyiOS.framework/Headers/SpotifyiOS.h"

@interface SpotifySDKBridge : NSObject <RCTBridgeModule, SPTSessionManagerDelegate>

@property (nonatomic, strong) SPTSessionManager *sessionManager;
@property (nonatomic, strong) SPTConfiguration *configuration;

//@property NSString *spotifyClientID;
//@property (nonatomic) NSURL *spotifyRedirectURL;

@end
