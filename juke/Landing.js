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
    TouchableOpacity,
    Touchable,
    NativeModules,
    Platform,
    Image,
    Dimensions,
    Keyboard,
    Animated
    } from 'react-native';
window.navigator.userAgent = 'react-native';
import io from 'socket.io-client/dist/socket.io';
import {createStackNavigator, createAppContainer} from "react-navigation";
import DeviceInfo from "react-native-device-info";
import qs from "query-string";

var spotifySDKBridge = NativeModules.SpotifySDKBridge;


export default class Landing extends Component {

    static navigationOptions = {
        header: null
    }

    componentDidMount() {
        this.keyboardDidShowSub = Keyboard.addListener("keyboardWillShow", this.handleKeyboardDidShow);
        this.keyboardDidHideSub = Keyboard.addListener("keyboardWillHide", this.handleKeyboardDidHide);
    }

    componentWillUnmount() {
        thsi.keyboardDidShowSub.remove();
        thsi.keyboardDidHideSub.remove();
    }

    handleKeyboardDidShow = (event) => {
        const keyboardHeight = event.endCoordinates.height;
        this.setState({keyboardShift: keyboardHeight});
    }

    handleKeyboardDidHide = (event) => {
        this.setState({keyboardShift: 0});
    }


    constructor(props) {
        super(props);
        this.state = {
            text: "",
            keyboardShift: 0,
            joinButton: false
        };
    }

    render() {
        const {navigate} = this.props.navigation;
        return (
            <View style={styles.body}>
                <Image
                    style={[
                        {width: Dimensions.get("window").width, height: Dimensions.get("window").height},
                        styles.backgroundImage
                    ]}
                    source={require("./img/background.jpg")}
                />
                <View style={styles.titleView}>
                    <Text style={styles.title}>Juke</Text>
                </View>
                <View style={[
                    {marginBottom: this.state.keyboardShift},
                    styles.lobbyButtons
                ]}>
                    <View style={styles.joinButtons}>
                        <TextInput
                            style = {styles.keyInput}
                            onChangeText = {(text) => {
                                this.setState({text});

                                if (text == "") {
                                    this.setState({joinButton: false});
                                } else {
                                    this.setState({joinButton: true});
                                }

                            }}
                            autoCorrect = {false}
                            autoCapitalize = "characters"
                            placeholder="LOBBY KEY"
                            placeholderTextColor="#bbbbbb"
                        >
                            <Text style={styles.keyInputText}>{this.state.text}</Text>
                        </TextInput>
                        <TouchableOpacity
                        onPress = {() => {

                            if (this.state.joinButton) {

                                const url = "https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/join_lobby";

                                fetch(url, {
                                    method: "POST",
                                    headers: {
                                        Accept: "application/json",
                                        "Content-Type": "application/x-www-form-urlencoded"
                                    },
                                    body: qs.stringify({
                                        uid: DeviceInfo.getUniqueId(),
                                        lobby_key: this.state.text
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
                            } else {
                                navigate("Scanner", spotifySDKBridge);
                            }
                        }}
                        >
                            <View style = {styles.joinLobbyButton}>
                                <Text style={styles.joinLobbyText}>{this.state.joinButton ? "JOIN" : "QR"}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.createButton}>
                        <TouchableOpacity
                        onPress = {() => {
                            navigate("CreateLobby", spotifySDKBridge);
                        }}
                        >
                            <View style={styles.createLobbyButton}>
                                <Text style={styles.createLobbyText}>CREATE LOBBY</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>


            </View>
        );
    }
};

const styles = StyleSheet.create({

    backgroundImage: {
        position: "absolute",
        top: 0, left: 0,
        zIndex: 0
    },

    body: {
        flex: 1,
        textAlign: "center",
        justifyContent: "space-around",
        backgroundColor: "#151515",
        alignItems: "center"
    },
    title: {
        fontSize: 30,
        color: "#ffffff",
        textAlign: "center",
        margin: 50,
        zIndex: 1
    },
    keyInput: {
        width: 150,
        height: 40,
        marginRight: 20,
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#ffffff",
        backgroundColor: "rgba(15,15,15,0.8)",
        borderRadius: 50,
        textAlign: "center"
    },
    keyInputText: {
        fontSize: 12,
        textAlign: "center",
        color: "#ffffff",
        backgroundColor: "rgba(0,0,0,0)"
    },
    joinLobbyButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#ffffff",
        backgroundColor: "rgba(15,15,15,1)",
        borderRadius: 40
    },
    joinLobbyText: {
        fontSize: 12,
        textAlign: "center",
        color: "#fff",
    },

    titleView: {
        flex: 3,
        width: "100%",
        justifyContent: "center",
        backgroundColor: "rgba(15,15,15,0.5)",
        zIndex: 1
    },

    lobbyButtons: {
        flex: 1,
        width: "100%",
        backgroundColor: "rgba(15,15,15,0.5)",
        zIndex: 1
    },
    joinButtons: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center"
    },
    createButton: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    createLobbyButton: {
        width: 210,
        height: 40,
        justifyContent: "center",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#ffffff",
        backgroundColor: "rgba(15,15,15,0.8)",
        borderRadius: 40
    },
    createLobbyText: {
        fontSize: 12,
        textAlign: "center",
        color: "#fff",
    }
});
