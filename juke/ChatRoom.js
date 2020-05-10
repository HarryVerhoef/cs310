import React, {Component} from "react";
import {
    StyleSheet,
    ScrollView,
    View,
    Text,
    TextInput,
    Button,
    Alert,
    TouchableOpacity,
    TouchableWithoutFeedback,
    NativeModules,
    Image,
    FlatList,
    Dimensions,
    Modal
} from "react-native";
window.navigator.userAgent = "react-native";

var spotifySDKBridge = NativeModules.SpotifySDKBridge;

export default class HostLobby extends Component {

    static navigationOptions = {
        header: null
    }

    constructor(props) {
        super(props);
        this.state = {
            text: ""
        }
    }

    render() {
        return (
            <View style={styles.body}>

                <View style={styles.lobbyInfo}>
                    <Text style={styles.lobbyName}>roadtrip</Text>
                    <Text style={styles.lobbyKey}>Join with: d334</Text>
                </View>

                <View style={styles.chats}>

                </View>

                <View style={styles.message}>
                    <TextInput
                    style={styles.messageInput}
                    value={this.state.message}
                    onChangeText = {(message) => { this.setState({message}); }}
                    placeholder="Message"
                    placeholderTextColor="#151515"
                    />
                </View>

                <View style={styles.username}>
                    <TextInput
                    style={styles.usernameInput}
                    value={this.state.text}
                    onChangeText = {(text) => { this.setState({text}); }}
                    placeholder="Username"
                    placeholderTextColor="#151515"
                    />
                </View>

            </View>
        )
    }
};

const styles = StyleSheet.create({
    body: {
        flex: 1,
        alignItems: "stretch"
    },

    lobbyInfo: {
        flex: 1,
        alignItems: "stretch",
        justifyContent: "center",
        backgroundColor: "#333333"
    },
    lobbyName: {
        textAlign: "center",
        color: "#ffffff",
        fontSize: 18,
        marginBottom: 10
    },
    lobbyKey: {
        textAlign: "center",
        color: "#cccccc"
    },

    chats: {
        flex: 3,
        backgroundColor: "#666666"
    },

    message: {
        flex: 1,
        backgroundColor: "#999999",
        alignItems: "center",
        justifyContent: "center"
    },
    messageInput: {
        height: "70%",
        width: "70%",
        textAlign: "center",
        borderWidth: 1,
        borderColor: "#aa3333",
        borderRadius: 10
    },

    username: {
        flex: 1,
        backgroundColor: "#cccccc",
        alignItems: "center",
        justifyContent: "center"
    },
    usernameInput: {
        height: "70%",
        width: "70%",
        textAlign: "center",
        borderWidth: 1,
        borderColor: "#aa3333",
        borderRadius: 10
    }
});
