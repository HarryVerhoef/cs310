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
    FlatList,
    Image
    } from 'react-native';
window.navigator.userAgent = 'react-native';
import io from 'socket.io-client/dist/socket.io';
import Carousel from "react-native-snap-carousel";
import DeviceInfo from "react-native-device-info";





export default class CreateLobby extends Component {

    constructor(props) {
        super(props);
        this.state = {
            lobbyName: "",
            modalVisible: true,
            isConnectedToSpotify: false,
            playlistModal: false,
            playlists: [{
                name: "placeholder",
                images: [{url: "https://picsum.photos/200"}],
            }],
            isSocketConnected: false
        };
    }

    setModableVisible(visible) {
        this.setState({modalVisible: visible});
    }

    togglePlaylistModal(data) {
        this.setState({playlistModal: !this.state.playlistModal});
        this.setState({playlists: data});
    }

    carouselRenderItem({item}) {
        return (
            <View style={styles.playlistCard}>
                <Image
                    style = {{width: 100, height: 100}}
                    source = {{
                        uri: "http://harrys-macbook-pro.local:3000/get-image",
                        method: "POST",
                        headers: {
                            Pragma: "no-cache"
                        },
                        body: "spotify_url=" + item.images[0].url
                    }}
                />
            </View>
        );
    }

    render() {
        const {navigate} = this.props.navigation;
        spotifySDKBridge = NativeModules.SpotifySDKBridge;

        return (
            <View style = {styles.createLobbyBody}>
                <View style = {styles.lobbyName}>
                    <TextInput
                        style = {styles.lobbyNameInput}
                        onChangeText = {(text) => {this.setState({lobbyName: text})}}
                        value = {this.state.lobbyName}
                        placeholder = "Lobby Name"
                        editable = {this.state.playlistModal}
                        maxLength = {40}
                        >
                    </TextInput>
                </View>

                <View style = {styles.spotifyFrame}>
                    {!this.state.isConnectedToSpotify && <TouchableHighlight
                        onPress = {() => {
                            spotifySDKBridge.instantiateBridge((error, result) => {
                                if (error) {
                                    Alert.alert("Error instantiating bridge: " + error);
                                } else if (result == 1) {
                                    spotifySDKBridge.auth((error, result) => {
                                        if (error) {
                                            Alert.alert("Error authenticating: " + error);
                                        } else if (result == 1) {
                                            this.setState({isConnectedToSpotify: true});
                                        } else if (result == 0) {
                                            Alert.alert("Result = 0 @ auth");
                                        }
                                    });
                                } else if (result == 0) {
                                    Alert.alert("Result = 0 @ instantiateBridge");
                                }
                            });


                        }}
                    >
                        <View style = {styles.spotifyConnectButton}>
                            <Text style = {styles.spotifyButtonText}>Connect to Spotify</Text>
                        </View>
                    </TouchableHighlight>}


                    {this.state.isConnectedToSpotify && <TouchableHighlight
                        onPress = {() => {
                            spotifySDKBridge.getPlaylists((error, results) => {
                                if (error) {
                                    Alert.alert(error);
                                } else {
                                    socket.emit("getPlaylists", DeviceInfo.getUniqueId());
                                    socket.on("gotPlaylists", (data) => {
                                        this.togglePlaylistModal(data);
                                        Alert.alert(data);
                                    });
                                    this.setModableVisible(!this.state.modalVisible);
                                }
                            });
                        }}

                    >
                        <View style = {styles.getPlaylistsButton}>
                            <Text>Choose Playlist</Text>
                        </View>
                    </TouchableHighlight>}


                    {this.state.playlistModal && <View
                        style = {styles.setPlaylistCarousel}
                    >


                        <Carousel
                            ref = {(c) => { this._carousel = c; }}
                            data = {this.state.playlists}
                            renderItem = {this.carouselRenderItem}
                            sliderWidth = {300}
                            itemWidth = {250}
                        />

                    </View>}
                </View>

                <View style = {styles.lobbySettings}>

                </View>

                <View style = {styles.createLobby}>
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    createLobbyBody: {
        flex: 1,
        backgroundColor: "#ffffff",
        justifyContent: "space-around"
    },

    lobbyName: {
        flex: 1,
        backgroundColor: "#333333",
        justifyContent: "center",
        alignItems: "center"
    },
    lobbyNameInput: {
        width: 300,
        height: 50,
        backgroundColor: "#8d8",

    },

    spotifyFrame: {
        flex: 2,
        backgroundColor: "#666666",
        justifyContent: "center",
        alignItems: "center"
    },
    spotifyConnectButton: {
        width: 100,
        height: 100,
        backgroundColor: "#29d",
        justifyContent: "center",
        alignItems: "center"
    },
    setPlaylistCarousel: {
        //
    },
    getPlaylistsButton: {
        width: 100,
        height: 100,
        backgroundColor: "#8bc6ef"
    },
    playlistCard: {
        backgroundColor: "#cccccc",
        width: 200,
        height: 200
    },

    lobbySettings: {
        flex: 2,
        backgroundColor: "#999999",
        justifyContent: "center",
        alignItems: "center"
    },

    createLobby: {
        flex: 1,
        backgroundColor: "#cccccc",
        justifyContent: "center",
        alignItems: "center"
    },


});
