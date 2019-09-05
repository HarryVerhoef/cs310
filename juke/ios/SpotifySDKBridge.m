//
//  SpotifySDKBridge.m
//  juke
//
//  Created by Harry Verhoef on 09/08/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "SpotifySDKBridgeHeader.h"




@implementation SpotifySDKBridge

AppDelegate *appDelegate;
          

RCT_EXPORT_MODULE();





RCT_EXPORT_METHOD(instantiateBridge)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    self.appDelegate  = (AppDelegate*)[[UIApplication sharedApplication] delegate];
  });
  [self.appDelegate initConfigure];
}

RCT_EXPORT_METHOD(configure)
{
  [self.appDelegate configureConfigure];
  
}

RCT_EXPORT_METHOD(auth)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self.appDelegate invokeAuthModal];
  });
  
}


RCT_EXPORT_METHOD(initRemote)
{
  [self.appDelegate initAppRemote];
}



RCT_EXPORT_METHOD(isSpotifyInstalled:(RCTResponseSenderBlock)callback) {
  dispatch_async(dispatch_get_main_queue(), ^{
    NSNumber *result = [NSNumber numberWithBool:[self.appDelegate isSpotifyInstalled]];
    callback(@[[NSNull null], result]);
  });
}

RCT_EXPORT_METHOD(start:(NSString *)uri jsCallback:(RCTResponseSenderBlock)jsCallback) {
//  dispatch_async(dispatch_get_main_queue(), ^{
//    if (!self.appRemote.connected) {
//      jsCallback(@[[NSNull null], [NSNumber numberWithInt:0]]);
//    } else {
//      self.appRemote.playerAPI.delegate = self;
//      [self.appRemote.playerAPI play:uri callback:^(id _Nullable result, NSError * _Nullable error) {
//        NSLog(@"fuck you");
//        if (error) {
//          NSLog(@"Error at play callback: %@", error);
//        } else {
//          NSLog(@"No error at play callback");
//          jsCallback(@[[NSNull null], result]);
//        }
//      }];
//    }
//  });
}

RCT_EXPORT_METHOD(res:(RCTResponseSenderBlock)jsCallback) {
  [self.appDelegate resume:jsCallback];
}


@end
