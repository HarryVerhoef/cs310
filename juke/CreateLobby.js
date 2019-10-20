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
    Linking,
    Modal,
    FlatList
    } from 'react-native';
window.navigator.userAgent = 'react-native';
import io from 'socket.io-client/dist/socket.io';
const socket;


export default class CreateLobby extends Component {

    state = {
        modalVisible: true,
        isConnectedToSpotify: false,
        playlistModal: false,
        playlists: []
    };

    setModableVisible(visible) {
        this.setState({modalVisible: visible});
    }

    togglePlaylistModal(data) {
        this.setState({playlistModal: !this.state.playlistModal});
        this.setState({playlists: data});
    }

    constructor(props) {
        super(props);
    }

    render() {
        const {navigate} = this.props.navigation;
        spotifySDKBridge = NativeModules.SpotifySDKBridge;

        return (
            <View style = {styles.lobbySettingsBody}>
            <View style = {styles.modalView}>
            <TouchableHighlight
            style = {styles.connectToSpotify}
            onPress = {() => {
                spotifySDKBridge.instantiateBridge((error, result) => {
                    if (error) {
                        Alert.alert("Error instantiating bridge: " + error);
                    } else if (result == 1) {
                        spotifySDKBridge.auth((error, result) => {
                            if (error) {
                                Alert.alert("Error authenticating: " + error);
                            } else if (result == 1) {
                                socket = io("http://harrys-macbook-pro.local:3000");
                            } else if (result == 0) {
                                Alert.alert("Result = 0 @ auth");
                            }
                        });
                    } else if (result == 0) {
                        Alert.alert("Result = 0 @ instantiateBridge");
                    }
                });


                this.state.isConnectedToSpotify = true;
                this.setModableVisible(!this.state.modalVisible);
            }}
            >
            <View style = {styles.spotifyConnectButton}>
            <View
                style = {styles.setPlaylistModal}
                visible = {this.state.playlistModal}

            >
                <FlatList
                    numColumns = {2}
                    data = {this.state.playlists}
                    renderItem = {({item}) => (
                        <Item
                            id = {item.id}
                            title = {item.name}
                        />
                    )}
                >
                </FlatList>
            </View>
                <Text style = {styles.spotifyButtonText}>Connect to Spotify</Text>
            </View>
            </TouchableHighlight>
            </View>
                <View>
                    <View style = {styles.modalViewStyle}>
                        <View style={styles.modalBody}>
                        <Text style={styles.modalText}>In order for juke to work we need your permission to talk to Spotify...</Text>

                        </View>
                    </View>
                </View>

                <TouchableHighlight
                    style = {styles.uploadPlaylistTouchable}
                    onPress = {() => {
                        spotifySDKBridge.getPlaylists((error, result) => {

                            if (error) {
                                Alert.alert("Error: " + error);
                            } else {
                                Alert.alert("Result : " + result);
                                socket.emit("getPlaylists");
                                socket.on("gotPlaylists", (data) => {
                                    Alert.alert(data);
                                    this.togglePlaylistModal(data);
                                })
                            }
                        });

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
                        spotifySDKBridge.play("spotify:track:3nc420PXjTdBV5TN0gCFkS", (error, events) => {
                            if (error) {
                                Alert.alert("Error playing uri: " + error);
                            } else {
                                // Should be fineeee
                                socket.emit("bp4");
                            }
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
    },
    modalViewStyle: {
        flex: 1,
        backgroundColor: "rgba(21,21,21,0.65)",
        alignItems: "center",
        justifyContent: "center"
    },
    modalBody: {
        backgroundColor: "#fff",
        borderRadius: 25,
        textAlign: "center",
        alignItems: "center",
        justifyContent: "center"
    },
    spotifyConnectButton: {
        width: 150,
        height: 150,
        margin: 20,
        textAlign: "center",
        backgroundColor: "#1db954",
        borderRadius: 25,
        justifyContent: "center"
    },
    modalText: {
        textAlign: "center",
        margin: 20
    },
    spotifyButtonText: {
        textAlign: "center",
        alignSelf: "center",
        color: "#fff"
    },
    modalView: {
        flex: 1,

    },
    setPlaylistModal: {
        flex: 1,
        backgroundColor: "#fff",
        alignSelf: "center",

    }

});
