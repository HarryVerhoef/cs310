import React, {Component} from "react";
import {
    View,
    Text,
    NativeModules,
    StyleSheet
} from "react-native";
import QRCodeScanner from "react-native-qrcode-scanner";

var spotifySDKBridge = NativeModules.SpotifySDKBridge;

export default class Scanner extends Component {

    constructor(props) {
        super(props);
    }

    joinLobby = (e) => {

        Alert.alert(e);

        const {navigate} = this.props.navigation;

        const join_url = "https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/join_lobby";

        fetch(join_url, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: qs.stringify({
                uid: DeviceInfo.getUniqueId(),
                lobby_key: e
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

            <View style={styles.body}>
                <QRCodeScanner onRead={this.joinLobby} />
            </View>

        )
    }
}

const styles = StyleSheet.create({

});
