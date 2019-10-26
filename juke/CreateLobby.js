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
var socket;


export default class CreateLobby extends Component {

    state = {
        lobbyName: "",
        modalVisible: true,
        isConnectedToSpotify: false,
        playlistModal: false,
        playlists: [{images: [{url: "https://picsum.photos/200"}]}]
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
                        body:{
                            img_uri: item.images[0].url
                        }
                    }}
                />
                <Text>{item.name} - item.owner.display_name</Text>
                <Text>{item.tracks.items.length} songs</Text>
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
                    <TouchableHighlight
                        onPress = {() => {
                            spotifySDKBridge.instantiateBridge((error, result) => {
                                if (error) {
                                    Alert.alert("Error instantiating bridge: " + error);
                                } else if (result == 1) {
                                    spotifySDKBridge.auth((error, result) => {
                                        if (error) {
                                            Alert.alert("Error authenticating: " + error);
                                        } else if (result == 1) {
                                            this.state.isConnectedToSpotify = true;
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
                            <Text style = {styles.spotifyButtonText}>Connect to Spotify</Text>
                        </View>
                    </TouchableHighlight>


                    <TouchableHighlight
                        onPress = {() => {
                            socket = io("http://harrys-macbook-pro.local:3000");
                            spotifySDKBridge.getPlaylists((error, results) => {
                                if (error) {
                                    Alert.alert(error);
                                } else {
                                    socket.emit("getPlaylists");
                                    socket.on("gotPlaylists", (data) => {
                                        this.togglePlaylistModal(data);
                                        Alert.alert(data);
                                    });
                                }
                            });
                        }}
                        visible = {this.state.isConnectedToSpotify && !this.state.playlistModal}
                    >
                        <View style = {styles.getPlaylistsButton}>
                            <Text>Choose Playlist</Text>
                        </View>
                    </TouchableHighlight>


                    <View
                        style = {styles.setPlaylistCarousel}
                        visible = {this.state.playlistModal}
                    >
                        <FlatList
                            data = {this.state.playlists}
                            keyExtractor = {(item) => {item.id}}
                            renderItem = {({item}) => (
                                <TouchableHighlight
                                    key = {item.id}
                                    onPress = {() => {
                                        Alert.alert(item);
                                    }}>
                                    <View style={styles.playlistButton}>
                                        <Text>{item.name}</Text>
                                    </View>
                                </TouchableHighlight>
                            )}>
                        </FlatList>

                        <Carousel
                            ref = {(c) => { this._carousel = c; }}
                            data = {this.state.playlists}
                            renderItem = {this.carouselRenderItem}
                            sliderWidth = {300}
                            itemWidth = {250}
                        />

                    </View>
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
        backgroundColor: "#ffffff"
    },

    lobbyName: {
        flex: 1
    },
    lobbyNameInput: {
        //
    },

    spotifyFrame: {
        flex: 2
    },
    setPlaylistCarousel: {
        position: "absolute"
    },
    playlistCard: {
        backgroundColor: "#cccccc",
        width: 200,
        height: 200
    },

    lobbySettings: {
        flex: 2
    },

    createLobby: {
        flex: 1
    },


});
