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
import DeviceInfo from "react-native-device-info";

var spotifySDKBridge = NativeModules.SpotifySDKBridge;


export default class Landing extends Component {

    constructor(props) {
        super(props);
        this.state = {text: ""};
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
                    />
                    <Button
                        style = {styles.joinLobbyButton}
                        onPress = {() => {
                            // socket.emit("joinRoom", this.state.text);
                        }}
                        title = "Join Lobby"
                    />
                </View>
                <Button
                    style = {styles.createLobbyButton}
                    onPress = {async () => {

                        // socket.emit("newLobby", DeviceInfo.getUniqueId());
                        // try {
                        //     let response = await fetch("https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/new_lobby", {
                        //         method: "POST",
                        //         headers: {
                        //             Accept: "application/json",
                        //             "Content-Type": "application/json"
                        //         },
                        //         body: JSON.stringify({
                        //             uid: DeviceInfo.getUniqueId();
                        //         })
                        //     });
                        //     Alert.alert(response.json());
                        //     navigate("CreateLobby", {
                        //         spotifySDKBridge: spotifySDKBridge
                        //     });
                        // } catch (error) {
                        //     navigate("CreateLobby", {
                        //         spotifySDKBridge: spotifySDKBridge
                        //     });
                        // }


                        // Surely no point of creating preemptive lobby when can create one whole lobby at CreateLobby.js
                        navigate("CreateLobby", {
                            spotifySDKBridge: spotifySDKBridge
                        });
                    }}
                    title = "Create Lobby"
                />

            </View>
        );
    }
};

const styles = StyleSheet.create({
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

    }
});
