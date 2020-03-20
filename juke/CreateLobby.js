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
    Image,
    Dimensions,
    Switch
    } from 'react-native';
window.navigator.userAgent = 'react-native';
import io from 'socket.io-client/dist/socket.io';
import Carousel from "react-native-snap-carousel";
import DeviceInfo from "react-native-device-info";
import {TapGestureHandler, State} from "react-native-gesture-handler";
import qs from "query-string";


export default class CreateLobby extends Component {

    static navigationOptions = {
        header: null
    }

    constructor(props) {
        super(props);
        this.state = {
            lobbyName: "",
            modalVisible: true,
            isConnectedToSpotify: false,
            playlistModal: false,
            playlists: [],
            isSocketConnected: false,


            activePlaylist: {
                name: "No playlist selected",
                tracks: {total: 0}
            },

            chatRoom: true,
            lyrics: true,
            volumeControl: true
        };
    }

    setModableVisible(visible) {
        this.setState({modalVisible: visible});
    }

    togglePlaylistModal(data) {
        this.setState({activePlaylist: data[0]});
        this.setState({playlists: data});
        this.setState({playlistModal: !this.state.playlistModal});
    }

    carouselRenderItem({item, index}) {
        return (
            <View style={styles.playlistCard}>
                <Image
                    style = {styles.playlistImage}
                    source = {{uri: item.images[0].url}}
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
                        placeholderTextColor = "#ffffff"
                        maxLength = {40}
                        >
                    </TextInput>
                </View>

                <View style = {styles.spotifyFrame}>
                    <View style = {styles.spotifyFrameChild}>
                        {!this.state.isConnectedToSpotify && <TouchableHighlight
                            onPress = {() => {
                                spotifySDKBridge.auth((error, result) => {
                                    if (error) {
                                        Alert.alert("Error authenticating: " + error);
                                    } else {
                                        this.setState({isConnectedToSpotify: true});
                                    }
                                });
                            }}
                        >
                            <View style = {styles.spotifyConnectButton}>
                                <Text style = {styles.spotifyButtonText}>Connect to Spotify</Text>
                            </View>
                        </TouchableHighlight>}


                        {this.state.isConnectedToSpotify  && !this.state.playlistModal && <TouchableHighlight
                            onPress = {() => {
                                spotifySDKBridge.getAccessToken((error, result) => {
                                    if (error) {
                                        Alert.alert(error);
                                    } else {

                                        const url = "https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/get_playlists";

                                        fetch(url, {
                                            method: "post",
                                            headers: {
                                                Accept: "application/json",
                                                "Content-Type": "application/x-www-form-urlencoded"
                                            },
                                            body: qs.stringify({
                                                "uid": DeviceInfo.getUniqueId(),
                                                "access_token": result
                                            }),
                                        })
                                        .then((response) => response.json())
                                        .then((responseJson) => {
                                            this.togglePlaylistModal(responseJson);
                                        })
                                        .catch((error) => {
                                            Alert.alert("Error while getting playlists: " + error);
                                        });
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
                                sliderWidth = {Dimensions.get("window").width}
                                itemWidth = {200}

                                activeSlideAlignment = "center"
                                inactiveSlideScale = {0.8}
                                inactiveSlideOpacity = {0.6}
                                slideStyle = {styles.slideStyle}
                                onSnapToItem = {(slideIndex) => {
                                    this.setState({activePlaylist: this.state.playlists[slideIndex]});
                                }}
                            />
                        </View>}
                    </View>
                </View>

                <View style = {styles.lobbySettings}>

                    <View style = {styles.playlistInfo}>
                        <Text style = {styles.playlistInfoText}>{this.state.activePlaylist.name}</Text>
                        <Text style = {styles.playlistInfoText}>{this.state.activePlaylist.tracks.total} Songs</Text>
                    </View>

                    <View style = {styles.lobbySettingsWrapper}>

                        <View style = {styles.lobbySwitchView}>
                            <Switch
                                value = {this.state.chatRoom}
                                onValueChange = {(value) => {
                                    this.setState({chatRoom: value});
                                }}
                                 style = {{marginLeft: 20}}
                            />
                            <Text style = {{marginLeft: 10}}>Chat Room</Text>
                        </View>

                        <View style = {styles.lobbySwitchView}>
                            <Switch
                                value = {this.state.lyrics}
                                onValueChange = {(value) => {
                                    this.setState({lyrics: value});
                                }}
                                 style = {{marginLeft: 20}}
                            />
                            <Text style = {{marginLeft: 10}}>Lyrics</Text>
                        </View>

                        <View style = {styles.lobbySwitchView}>
                            <Switch
                                value = {this.state.volumeControl}
                                onValueChange = {(value) => {
                                    this.setState({volumeControl: value});
                                }}
                                 style = {{marginLeft: 20}}
                            />
                            <Text style = {{marginLeft: 10}}>Volume Control</Text>
                        </View>

                    </View>

                </View>

                <View style = {styles.createLobby}>
                    <TouchableHighlight
                        onPress = {() => {

                            if (!this.state.lobbyName) {
                                Alert.alert("Playlist must have a name");
                                return;
                            }

                            spotifySDKBridge.getAccessToken((error, result) => {
                                if (error) {
                                    Alert.alert("ERROR: " + error);
                                } else {
                                    const url = "https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/make_lobby";
                                    fetch(url, {
                                        method: "POST",
                                        headers: {
                                            Accept: "application/json",
                                            "Content-Type": "application/x-www-form-urlencoded"
                                        },
                                        body: qs.stringify({
                                            uid: DeviceInfo.getUniqueId(),
                                            name: this.state.lobbyName,
                                            playlist_id: this.state.activePlaylist.id,
                                            chat: this.state.chatRoom,
                                            lyrics: this.state.lyrics,
                                            volume: this.state.volumeControl,
                                            access_token: result
                                        })
                                    })
                                    .then((response) => response.json())
                                    .then((responseJson) => {
                                        navigate("HostLobby", responseJson);
                                    })
                                    .catch((error) => {
                                        Alert.alert(error);
                                    });
                                }
                            });


                        }}
                        style = {{height: "75%"}}
                    >
                        <View style = {styles.createLobbyButton}>
                            <Text style = {{color: "#ffffff"}}>Create Lobby</Text>
                        </View>

                    </TouchableHighlight>
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
        width: 200,
        height: "75%",
        backgroundColor: "#333333",
        textAlign: "center",
        color: "#ffffff",
        borderColor: "#cc2233",
        borderRadius: 10,
        borderWidth: 1,
    },

    spotifyFrame: {
        flex: 3,
        backgroundColor: "#666666",
        justifyContent: "center",
        alignItems: "stretch"
    },
    spotifyFrameChild: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center"
    },
    spotifyConnectButton: {
        width: 100,
        height: 100,
        backgroundColor: "#29d",
        justifyContent: "center",
        alignItems: "center"
    },
    setPlaylistCarousel: {
        flex: 1,
        justifyContent: "center"
    },
    getPlaylistsButton: {
        width: 100,
        height: 100,
        backgroundColor: "#8bc6ef"
    },
    playlistCard: {
        backgroundColor: "#cccccc",
        width: 200,
        height: 200,
        shadowColor: "#000000",
        shadowOpacity: 0.8,
        shadowRadius: 5
    },
    cardContainer: {
        justifyContent: "center"
    },
    slideStyle: {
        justifyContent: "center"
    },
    playlistImage: {
        width: 200,
        height: 200
    },

    lobbySettings: {
        flex: 2,
        backgroundColor: "#999999",
        alignItems: "center"
    },
    playlistInfo: {
        flex: 1,
        width: 150,
        backgroundColor: "#666666",
        justifyContent: "space-around",
        alignItems: "stretch",
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10
    },
    playlistInfoText: {
        textAlign: "center",
        color: "#ffffff"
    },
    lobbySettingsWrapper: {
        flex: 3,
        width: "100%",
        alignItems: "stretch"
    },
    lobbySwitchView: {
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-start",
        flexDirection: "row"
    },



    createLobby: {
        flex: 1,
        backgroundColor: "#cccccc",
        justifyContent: "center",
        alignItems: "center"
    },
    createLobbyButton: {
        width: 200,
        height: "100%",
        backgroundColor: "#cc2233",
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center"
    }



});
