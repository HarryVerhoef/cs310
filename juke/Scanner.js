"use strict";
import React, {Component} from "react";
import {
    View,
    Text,
    NativeModules,
    StyleSheet,
    Alert
} from "react-native";
import {RNCamera} from "react-native-camera"
import qs from "query-string";
import DeviceInfo from "react-native-device-info";


var spotifySDKBridge = NativeModules.SpotifySDKBridge;

export default class Scanner extends Component {

    static navigationOptions = {
        header: null
    }

    constructor(props) {
        super(props);
        this.state = {joiningLobby: false};
    }

    joinLobby = ({data}) => {

        this.setState({joiningLobby: true});

        const {navigate} = this.props.navigation;

        const join_url = "https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/join_lobby";

        if (!this.state.joiningLobby) {
            fetch(join_url, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: qs.stringify({
                    uid: DeviceInfo.getUniqueId(),
                    lobby_key: data
                })
            })
            .then((response) => response.json())
            .then((responseJson) => {
                this.setState({joiningLobby: false});
                if (responseJson.lobby_key == data) {
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
                }

            })
            .catch((error) => {
                this.setState({joiningLobby: false});
                Alert.alert("ERROR: " + error);
            });
        }



    }

    render() {

        return (

            <RNCamera
            ref={ref => {
                this.camera = ref;
            }}
            style={styles.camera}
            captureAudio={false}
            onBarCodeRead={this.joinLobby}
            >
            </RNCamera>

        )
    }
}

const styles = StyleSheet.create({
    camera: {
        flex: 1,
        width: "100%"
    },
});
