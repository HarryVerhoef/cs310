//
//  SpotifySDKBridge.m
//  juke
//
//  Created by Harry Verhoef on 09/08/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "SpotifySDKBridgeHeader.h"

static NSString * const spotifyClientID = @"ff19e2ea3546447e916e43dcda51a298";
static NSString * const spotifyRedirectURLString = @"http://harrys-macbook-pro.local:3000/spotify-login-callback";


@implementation SpotifySDKBridge




RCT_EXPORT_MODULE();

SPTConfiguration *configuration;

RCT_EXPORT_METHOD(
    sessionManager:(SPTSessionManager *)manager didInitiateSession:(SPTSession *)session {
      NSLog(@"success: %@", session);
    }
);

RCT_EXPORT_METHOD(
    sessionManager:(SPTSessionManager *)manager didFailWithError:(NSError *)error {
      NSLog(@"fail: %@", error);
    }
);

RCT_EXPORT_METHOD(
    sessionManager:(SPTSessionManager *)manager didRenewSession:(SPTSession *)session {
      NSLog(@"renewed: %@", session);
    }
);

RCT_EXPORT_METHOD(
    configure {
      configuration = [SPTConfiguration configurationWithClientID:spotifyClientID redirectURL:[NSURL URLWithString:spotifyRedirectURLString]];
    }
                  
);

@end
