//
//  SpotifySDKBridgeHeader.h
//  juke
//
//  Created by Harry Verhoef on 09/08/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import "AppDelegate.h"

@interface SpotifySDKBridge : NSObject <RCTBridgeModule>


@property AppDelegate *appDelegate;



@end
