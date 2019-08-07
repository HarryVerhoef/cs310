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
    SpotifyBridge
    } from 'react-native';

window.navigator.userAgent = 'react-native';
import io from 'socket.io-client/dist/socket.io';
import { YellowBox } from 'react-native'

YellowBox.ignoreWarnings([
  'Unrecognized WebSocket connection option(s) `agent`, `perMessageDeflate`, `pfx`, `key`, `passphrase`, `cert`, `ca`, `ciphers`, `rejectUnauthorized`. Did you mean to put these under `headers`?'
]);
import {createStackNavigator, createAppContainer} from "react-navigation";


const socket = io("http://harrys-macbook-pro.local:3000");

class Landing extends Component {

    constructor(props) {
        super(props);
        this.state = {text: ""};
        this.socket = socket;
    }

    render() {
        const {navigate} = this.props.navigation;
        return (
            <View style={styles.body}>
                <Text style={styles.title}>Juke</Text>
                <View>
                    <TextInput
                        style = {styles.keyInput}
                        onChangeText = {(text) => this.setState({text})}
                        value = {this.state.text}
                        autoCorrect = {false}
                        autoFocus = {true}
                    />
                    <Button
                        style = {styles.joinLobbyButton}
                        onPress = {() => {
                            this.socket.emit("joinRoom", this.state.text);
                        }}
                        title = "Join Lobby"
                    />
                </View>
                <Button
                    style = {styles.createLobbyButton}
                    onPress = {() => {
                        this.socket.emit("setHash");
                        this.socket.on("getHash", (data) => {
                            navigate("LobbySettings", {key: data, socket: this.socket.id});
                        });
                    }}
                    title = "Create Lobby"
                />

            </View>
        );
    }
};

class LobbySettings extends Component {
    constructor(props) {
        super(props);
        this.state = {text: ""};
        this.socket = socket;
    }

    render() {

        const {navigate} = this.props.navigation;

        return (
            <View style = {styles.lobbySettingsBody}>
                <TextInput
                    style = {styles.lobbyNameInput}
                    onChangeText = {(text) => this.setState({text})}
                    placeholder = "Lobby Name"
                    placeholderTextColor = "#fff"
                    autoFocus = {true}
                />
                <TouchableHighlight
                    style = {styles.uploadPlaylistTouchable}
                    onPress = {() => {
                        // Pressed upload playlist
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
                        // Pressed create lobby button
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
    // Global Styles
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
    // Landing Styles
    body: {
        flex: 1,
        textAlign: "center",
        justifyContent: "space-around",
        backgroundColor: "#151515",
        alignItems: "center"
    },
    title: {
        fontSize: 30,
        color: "#29d",
        textAlign: "center",
        margin: 50
    },
    keyInput: {
        width: 150,
        height: 50,
        textAlign: "center",
        backgroundColor: "#fff",
        margin: 20,
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#29d",
        backgroundColor: "#383838",
        borderRadius: 5,
        fontSize: 20,
        color: "#fff"

    },
    // LobbySettings stles
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

const App = createStackNavigator({
    LandingPage: {
        screen: Landing
    },
    LobbySettings: {
        screen: LobbySettings
    }
});

export default createAppContainer(App);
