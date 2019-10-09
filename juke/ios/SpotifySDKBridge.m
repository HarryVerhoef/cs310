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





RCT_EXPORT_METHOD(instantiateBridge:(RCTResponseSenderBlock)jsCallback)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    self.appDelegate  = (AppDelegate*)[[UIApplication sharedApplication] delegate];
    jsCallback(@[[NSNull null], @1]);
  });
  
//  [self.appDelegate initConfigure];
}


RCT_EXPORT_METHOD(auth:(RCTResponseSenderBlock)jsCallback)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSNumber *result = [NSNumber numberWithBool:[self.appDelegate invokeAuthModal]];
    jsCallback(@[[NSNull null], result]);
  });
  
}

RCT_EXPORT_METHOD(getPlaylists:(RCTResponseSenderBlock)jsCallback) {
  NSArray *result = [self.appDelegate getPlaylists];
  jsCallback(@[[NSNull null], result]);
}

RCT_EXPORT_METHOD(play:(NSString *)uri callback:(RCTResponseSenderBlock)jsCallback) {
  dispatch_async(dispatch_get_main_queue(), ^{
    NSNumber *result = [NSNumber numberWithBool:[self.appDelegate playURI:uri]];
    jsCallback(@[[NSNull null], result]);
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

RCT_EXPORT_METHOD(connect:(RCTResponseSenderBlock)jsCallback) {
  dispatch_async(dispatch_get_main_queue(), ^{
    NSNumber *result = [NSNumber numberWithBool:[self.appDelegate connectAppRemote]];
    jsCallback(@[[NSNull null], result]);
  });
}




@end
