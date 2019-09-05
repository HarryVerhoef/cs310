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
    Platform,
    Linking
    } from 'react-native';
window.navigator.userAgent = 'react-native';
import io from 'socket.io-client/dist/socket.io';



export default class CreateLobby extends Component {
    constructor(props) {
        super(props);
    }

    render() {

        const {navigate} = this.props.navigation;
        const socket = this.props.navigation.getParam("socket", 0);
        const spotifySDKBridge = this.props.navigation.getParam("spotifySDKBridge", 0);

        spotifySDKBridge.isSpotifyInstalled((error, result) => {
            if (error) {
                Alert.alert(error);
            } else if (result == 0) {
                // Spotify is not installed.
                Linking.openURL(Platform.select({
                    ios: "itms-apps://itunes.apple.com/app/id324684580",
                    android: "undefined"
                }));
            } else if (result == 1) {
                // Spotify is installed
                spotifySDKBridge.initRemote();
                socket.emit("bp3");
                spotifySDKBridge.auth();
                socket.emit("bp4");
            } else {
                Alert.alert("Not sure if spotify is installed: " + result);
            }
        });

        return (
            <View style = {styles.lobbySettingsBody}>
                <TextInput
                    style = {styles.lobbyNameInput}
                    onChangeText = {(text) => this.setState({text})}
                    placeholder = "Lobby Name"
                    placeholderTextColor = "#fff"
                />
                <TouchableHighlight
                    style = {styles.uploadPlaylistTouchable}
                    onPress = {() => {

                        // spotifySDKBridge.start("spotify:track:3a1lNhkSLSkpJE4MSHpDu9", (error, events) => {
                        //     if (error) {
                        //         Alert.alert("Error" + error);
                        //     } else {
                        //         Alert.alert("Event");
                        //         this.setState({events: events});
                        //         Alert.alert(events);
                        //         Alert.alert("events" + events);
                        //     }
                        // });
                    }}
                >
                    <View style={styles.uploadPlaylistView}>
                        <Text style={styles.uploadPlaylistText}>+</Text>
                        <Text style={styles.uploadPlaylistText}>Set lobby playlist</Text>
                    </View>
                </TouchableHighlight>
                <TouchableHighlight
                    style = {styles.touchableHighlightBottom}
                    onPress = {() => {
                        // spotifySDKBridge.initRemote();
                        spotifySDKBridge.res((error, events) => {
                            Alert.alert("Error: " + error);
                            Alert.alert("Events: " + events);
                        });
                    }}
                >
                <View style = {styles.redButton}>
                    <Text style={styles.redButtonText}>Create Lobby!</Text>
                </View>
                </TouchableHighlight>

            </View>
        );
    }
}

const styles = StyleSheet.create({
    touchableHighlightBottom: {
        height: 60,
        margin: 20,
        borderRadius: 10,
        backgroundColor: "#c33",
        justifyContent: "center"
    },
    redButton: {
        color: "#fff",
        textAlign: "center",
        justifyContent: "center",
    },
    redButtonText: {
        textAlign: "center",
        color: "#fff",
        fontSize: 25
    },
    lobbySettingsBody: {
        flex: 1,
        textAlign: "center",
        justifyContent: "space-between",
        backgroundColor: "#383838",
        alignItems: "stretch"
    },
    lobbyNameInput: {
        height: 60,
        color: "#fff",
        backgroundColor: "#484848",
        textAlign: "center",
        margin: 20,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#c33"
    },
    setLobbySettingsButton: {
        width: 400,
        height: 50,
        backgroundColor: "#c33",
        color: "#fff"
    },
    uploadPlaylistTouchable: {
        width: 175,
        height: 175,
        alignSelf: "center",
        backgroundColor: "#484848",
        justifyContent: "center"
    },
    uploadPlaylistText: {
        textAlign: "center",
        color: "#fff"
    }
});
