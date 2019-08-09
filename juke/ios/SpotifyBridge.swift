//
//  SpotifyBridge.swift
//  juke
//
//  Created by Harry Verhoef on 09/08/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import
@objc(SpotifyBridge)
class SpotifyBrudge: NSObject {
  @objc
  func constantsToExport() -> [AnyHashable : Any]! {
    return ["initialCount": 0]
  }
  
  func sessionManager(manager: SPTSessionManager, didInitiate session: SPTSession) {
    print("success", session)
  }
  func sessionManager(manager: SPTSessionManager, didFailWith error: Error) {
    print("fail", error)
  }
  func sessionManager(manager: SPTSessionManager, didRenew session: SPTSession) {
    print("renewed", session)
  }
}
