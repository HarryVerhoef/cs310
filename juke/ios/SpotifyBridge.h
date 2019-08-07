//
//  SpotifyBridge.h
//  juke
//
//  Created by Harry Verhoef on 06/08/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import "SpotifyiOS.framework/Headers/SpotifyiOS.h"
@interface SpotifyBridge : NSObject <RCTBridgeModule, SPTSessionManagerDelegate>

@property (nonatomic, strong) SPTSessionManager *sessionManager;
@property (nonatomic, strong) SPTConfiguration *configuration;



@end
