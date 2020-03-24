"use strict";
import React, {Component} from "react";
import {
    View,
    Text,
    NativeModules,
    StyleSheet,
    Alert
} from "react-native";
import QRCodeScanner from "react-native-qrcode-scanner";

var spotifySDKBridge = NativeModules.SpotifySDKBridge;

export default class QRScanner extends Component {

    static navigationOptions = {
        header: null
    }

    constructor(props) {
        super(props);
    }

    joinLobby = (e) => {

        key = e.data;

        const {navigate} = this.props.navigation;

        Alert.alert(key);

        const join_url = "https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/join_lobby";

        fetch(join_url, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: qs.stringify({
                uid: DeviceInfo.getUniqueId(),
                lobby_key: key
            })
        })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.lobby_key == this.state.text) {
                navigate("InLobby", {
                    spotifySDKBridge: spotifySDKBridge,
                    lobby_key: responseJson.lobby_key,
                    lobby_name: responseJson.lobby_name,
                    active_song: responseJson.active_song,
                    votes: responseJson.votes,
                    chat: false,
                    lyrics: false,
                    volume: false
                });
            } else {
                Alert.alert("Lobby does not exist");
            }
        })
        .catch((error) => {
            Alert.alert("ERROR: " + error);
        });

    }

    render() {

        return (

                <QRCodeScanner
                onRead={async (e) => {
                    try {
                        await Linking.openURL(e.data).catch(err =>
                            console.error('An error occured', err)
                        ).promise();
                    } catch (error) {
                        Alert.alert(error);
                    }

                }}
                topContent={
                    <View style={styles.topContent}>
                        <Text style={styles.contentText}>Anyone in the lobby can view the QR code by double-tapping the album cover</Text>
                    </View>
                }
                bottomContent={
                    <View style={styles.bottomContent}>
                        <Text style={styles.contentText}>Hold your device still and make sure the QR code is visible</Text>
                    </View>
                }
                />

        )
    }
}

const styles = StyleSheet.create({
    body: {
        width: "100%",
        height: "100%"
    },
    contentText: {
        color: "#151515"
    }
});
