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


RCT_EXPORT_METHOD(auth:(RCTResponseSenderBlock)jsCallback)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    self.appDelegate  = (AppDelegate*)[[UIApplication sharedApplication] delegate];
    NSNumber *result = [NSNumber numberWithBool:[self.appDelegate invokeAuthModal]];
    jsCallback(@[[NSNull null], result]);
  });
  
}

RCT_EXPORT_METHOD(play:(NSString *)uri callback:(RCTResponseSenderBlock)jsCallback) {
  NSNumber *result = [NSNumber numberWithBool:[self.appDelegate playURI:uri]];
  jsCallback(@[[NSNull null], result]);
}

RCT_EXPORT_METHOD(skip:(RCTResponseSenderBlock)jsCallback) {
  NSNumber *result = [NSNumber numberWithBool: [self.appDelegate skipSong]];
  jsCallback(@[[NSNull null], result]);
}

RCT_EXPORT_METHOD(queue:(NSString *)uri callback:(RCTResponseSenderBlock)jsCallback) {
  NSNumber *result = [NSNumber numberWithBool:[self.appDelegate queue:uri]];
  jsCallback(@[[NSNull null], result]);
}

RCT_EXPORT_METHOD(getAccessToken:(RCTResponseSenderBlock)jsCallback) {
  jsCallback(@[[NSNull null], [self.appDelegate getAccessToken]]);
}

@end
