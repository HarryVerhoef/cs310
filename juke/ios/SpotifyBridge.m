//
//  SpotifyBridge.m
//  juke
//
//  Created by Harry Verhoef on 06/08/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//
#import "SpotifyBridge.h"
#import "SpotifyiOS.framework/Headers/SpotifyiOS.h"
@implementation SpotifyBridge

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(
  sessionManager:(SPTSessionManager *)manager didInitiateSession:(SPTSession *)session {
    NSLog(@"success: %@", session);
});

RCT_EXPORT_METHOD(
  sessionManager:(SPTSessionManager *)manager didFailWithError:(NSError *)error {
    NSLog(@"fail: %@", error);
});

RCT_EXPORT_METHOD(
  sessionManager:(SPTSessionManager *)manager didRenewSession:(SPTSession *)session {
    NSLog(@"renewed: %@", session);
});

+ SString *spotifyClientID = @"ff19e2ea3546447e916e43dcda51a298";
+ NSURL *spotifyRedirectURL = [NSURL URLWithString:@"http://harrys-macbook-pro.local:3000/spotify-login-callback"];

+ self.configuration  = [[SPTConfiguration alloc] initWithClientID:spotifyClientID redirectURL:spotifyRedirectURL];

@end


