import React, {Component} from 'react';
import {
    SafeAreaView,
    StyleSheet,
    ScrollView,
    View,
    Text,
    StatusBar,
    TextInput,
    Button,
    Alert,
    TouchableHighlight,
    Touchable,
    NativeModules,
    Platform
    } from 'react-native';

window.navigator.userAgent = 'react-native';
import io from 'socket.io-client/dist/socket.io';
import {createStackNavigator, createAppContainer} from "react-navigation";
import { YellowBox } from 'react-native';
import Landing from "juke/Landing.js";
import Scanner from "juke/Scanner.js";
import CreateLobby from "juke/CreateLobby.js";
import HostLobby from "juke/HostLobby.js";
import InLobby from "juke/InLobby.js";

YellowBox.ignoreWarnings([
  'Unrecognized WebSocket connection option(s) `agent`, `perMessageDeflate`, `pfx`, `key`, `passphrase`, `cert`, `ca`, `ciphers`, `rejectUnauthorized`. Did you mean to put these under `headers`?'
]);

const App = createStackNavigator({
    LandingPage: {
        screen: Landing
    },
    Scanner: {
        screen: Scanner
    },
    InLobby: {
        screen: InLobby
    },
    CreateLobby: {
        screen: CreateLobby
    },
    HostLobby: {
        screen: HostLobby
    }
});

export default createAppContainer(App);
