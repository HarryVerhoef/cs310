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
    NativeModules,
    Modal,
    FlatList,
    Image,
    Dimensions,
    Switch
} from "react-native";
window.navigator.userAgent = "react-native";
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


            activePlaylist: {
                name: "No playlist selected",
                tracks: {total: 0}
            },

            chatRoom: true,
            lyrics: true,
            volumeControl: true
        };
    }

    togglePlaylistModal(data) {
        this.setState({activePlaylist: data[0]});
        this.setState({playlists: data});
        this.setState({playlistModal: !this.state.playlistModal});
    }

    carouselRenderItem({item, index}) {
        return (
            <View style={styles.playlistCard}>
                <Image style={styles.playlistImage} source={{uri: item.images[0].url}} />
            </View>
        );
    }

    render() {

        const {navigate} = this.props.navigation;
        spotifySDKBridge = NativeModules.SpotifySDKBridge;

        return (
            <View style={styles.createLobbyBody}>

                <View style={styles.lobbyName}>
                    <TextInput
                    style={styles.lobbyNameInput}
                    onChangeText={(text) => {this.setState({lobbyName: text})}}
                    placeholder="LOBBY NAME"
                    placeholderTextColor="#bbbbbb"
                    autoCorrect={false}
                    maxLength={40}
                    >
                        <Text style={styles.lobbyNameText}>{this.state.lobbyName}</Text>
                    </TextInput>
                </View>

                <View style={styles.playerView}>
                    {!this.state.isConnectedToSpotify && <TouchableOpacity
                    onPress={() => {
                        spotifySDKBridge.auth((error, result) => {
                            if (error) {
                                Alert.alert("Error authenticating: " + error);
                            } else {
                                this.setState({isConnectedToSpotify: true});
                            }
                        });
                    }}
                    >
                        <View style={styles.spotifyButton}>
                            <Text style={styles.spotifyButtonText}>CONNECT TO SPOTIFY</Text>
                        </View>
                    </TouchableOpacity>}


                    {this.state.isConnectedToSpotify  && !this.state.playlistModal && <TouchableOpacity
                    onPress={() => {
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
                    }}>
                        <View style={styles.spotifyButton}>
                            <Text style={styles.spotifyButtonText}>CHOOSE PLAYLIST</Text>
                        </View>
                    </TouchableOpacity>}

                    {this.state.playlistModal && <View style={styles.TrackImageView}>

                        <Image style={styles.shadowUp} source={require("./img/black-shadow-png-4.png")} />

                        <View style={styles.trackImageWrapper}>
                            <Image style={styles.playlistImageBlurred} source={{uri: this.state.activePlaylist.images[0].url}} blurRadius={10} />
                        </View>

                        <View style={styles.setPlaylistCarousel}>
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
                        </View>
                    </View>}

                    <View style={styles.playlistInfo}>
                        <Text style={styles.playlistInfoName}>{this.state.activePlaylist.name}</Text>
                        <Text style={styles.playlistInfoSongs}>{this.state.activePlaylist.tracks.total} Songs</Text>
                    </View>

                </View>

                <View style={styles.lobbySettings}>

                    <View style={styles.lobbySettingsWrapper}>

                        <View style={styles.lobbySwitchView}>
                            <Switch
                                value={this.state.chatRoom}
                                onValueChange={(value) => {
                                    this.setState({chatRoom: value});
                                }}
                                style={{marginLeft: 20}}
                            />
                            <Text style = {{marginLeft: 10}}>CHAT</Text>
                        </View>

                        <View style = {styles.lobbySwitchView}>
                            <Switch
                                value={this.state.lyrics}
                                onValueChange={(value) => {
                                    this.setState({lyrics: value});
                                }}
                                style={{marginLeft: 20}}
                            />
                            <Text style={{marginLeft: 10}}>DESCRIPTION</Text>
                        </View>

                        <View style={styles.lobbySwitchView}>
                            <Switch
                                value={this.state.volumeControl}
                                onValueChange={(value) => {
                                    this.setState({volumeControl: value});
                                }}
                                style={{marginLeft: 20}}
                            />
                            <Text style={{marginLeft: 10}}>VOLUME</Text>
                        </View>

                    </View>

                </View>

                <View style={styles.createLobby}>
                    <TouchableOpacity
                    onPress={() => {

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
                    }}>
                        <View style={styles.createLobbyButton}>
                            <Text style={styles.createLobbyText}>CREATE LOBBY</Text>
                        </View>
                    </TouchableOpacity>
                </View>

            </View>
        );
    }
}

const styles = StyleSheet.create({
    createLobbyBody: {
        flex: 1,
        justifyContent: "space-around"
    },

    playerView: {
        position: "relative",
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").width,
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        backgroundColor: "#666666"
    },
    TrackImageView: {
        position: "absolute",
        top: 0,
        left: 0,
        backgroundColor: "#666666",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 0
    },
    trackImageWrapper: {
        shadowColor: "#000000",
        shadowOpacity: 0.8,
        shadowRadius: 5,
        width: "100%",
        height: "100%"
    },

    lobbyName: {
        position: "absolute",
        width: "100%",
        height: 50,
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "#151515",
        fontSize: 20,
        paddingTop: 40,
        zIndex: 3

    },
    lobbyNameInput: {
        width: "80%",
        height: 40,
        backgroundColor: "rgba(15,15,15,0.8)",
        textAlign: "center",
        color: "#ffffff",
        borderColor: "#ffffff",
        borderRadius: 40,
        borderWidth: 1,
    },
    lobbyNameText: {
        backgroundColor: "rgba(0,0,0,0)",
        textAlign: "center",
        color: "#ffffff",
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
    spotifyButton: {
        width: Dimensions.get("window").width * 0.8,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#ffffff",
        backgroundColor: "rgba(15,15,15,0.8)",
        borderRadius: 40
    },
    spotifyButtonText: {
        fontSize: 12,
        textAlign: "center",
        color: "#ffffff"
    },
    setPlaylistCarousel: {
        position: "absolute",
        top: 0, left: 0,
        width: "100%",
        height: Dimensions.get("window").width,
        justifyContent: "center",
        zIndex: 101
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
    shadowUp: {
        position: "absolute",
        width: Dimensions.get("window").width,
        height: (Dimensions.get("window").width * 0.15) + (Dimensions.get("window").width * 1.15),
        left: 0,
        top: -(Dimensions.get("window").width * 0.15),
        zIndex: 100
    },
    playlistImageBlurred: {
        width: 1.4 * Dimensions.get("window").width,
        height: 1.4 * Dimensions.get("window").width,
        top: -0.2 * Dimensions.get("window").width,
        left: -0.2 * Dimensions.get("window").width
    },

    lobbySettings: {
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height - (Dimensions.get("window").width + 90),
        backgroundColor: "#ffffff",
        alignItems: "center"
    },

    playlistInfo: {
        position: "absolute",
        bottom: 0, left: 0,
        alignItems: "stretch",
        height: 50,
        justifyContent: "flex-end",
        textAlign: "left",
        color: "#151515",
        padding: 5,
        zIndex: 105
    },
    playlistInfoName: {
        color: "#ffffff",
        fontWeight: "bold",
        textAlign: "left",
        fontSize: 25,
        zIndex: 111
    },
    playlistInfoSongs: {
        color: "#bbbbbb",
        fontSize: 18,
        textAlign: "left",
        zIndex: 112
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
        width: "100%",
        height: 90,
        backgroundColor: "#ffffff",
        justifyContent: "center",
        alignItems: "center"
    },
    createLobbyButton: {
        width: Dimensions.get("window").width * 0.8,
        height: 40,
        backgroundColor: "rgba(15,15,15,0.8)",
        borderWidth: 1,
        borderColor: "#ffffff",
        borderRadius: 40,
        justifyContent: "center",
        alignItems: "center"
    },
    createLobbyText: {
        fontSize: 12,
        color: "#ffffff",
        textAlign: "center"
    }
});
