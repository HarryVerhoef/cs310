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
    TouchableWithoutFeedback,
    Touchable,
    NativeModules,
    Platform,
    Image,
    FlatList,
    Dimensions
    } from 'react-native';
import ProgressBar from "./ProgressBar.js";
import Track from "./Track.js";
window.navigator.userAgent = 'react-native';
import {createStackNavigator, createAppContainer} from "react-navigation";
import DeviceInfo from "react-native-device-info";
import {TapGestureHandler, State} from "react-native-gesture-handler";
import qs from "query-string";

var spotifySDKBridge = NativeModules.SpotifySDKBridge;

export default class HostLobby extends Component {

    static navigationOptions = {
        header: null
    }

    doubleTapRef = React.createRef();


    ws = new WebSocket("https://5b5gjj48d4.execute-api.us-west-2.amazonaws.com/epsilon-2?uid=" + DeviceInfo.getUniqueId());

    constructor(props) {
        super(props);
        this.state = {
            recommendations: [],
            lobby: {},
            selected: {},
            activeSong: {
                isSet: false,
                name: "<SongName>",
                uri: "",
                artists: "<Artists>",
                length: 100000
            },
            nextSong: {isSet: false},
            voteEnabled: false,
            votes: {},
            isMusicPlaying: false,
            userVoteIndex: -1,
            userVoteWeighting: 1,
            track_description: "Loading description...",
            show_description: false,
            recommendations_ready: false
        }
    }

    getStoredRecommendations() {
        /* Fetch current lobby recommendations object */
        const recommendations_url = "https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/get_stored_recommendations";
        fetch(recommendations_url, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: qs.stringify({
                uid: DeviceInfo.getUniqueId()
            })
        })
        .then((response) => response.json())
        .then((responseJson) => {
            // Alert.alert("RECOMMENDATIONS: " + JSON.stringify(responseJson.L));
            this.setState({
                recommendations: responseJson.recommendations.L,
                userVoteWeighting: parseFloat(responseJson.user_weighting),
                voteEnabled: true
                // recommendations_ready: true
            });
        })
        .catch((error) => {
            Alert.alert("ERROR: " + error);
        });
    }

    getRecommendations(access_token, callback) {

        const url = "https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/get_recommendations";

        // this.setState({recommendations_ready: false});

        fetch(url, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: qs.stringify({
                "uid": DeviceInfo.getUniqueId(),
                "access_token": access_token
            })
        })
        .then((response) => response.json())
        .then((responseJson) => {
            // this.setState({
            //     voteEnabled: true
            // });
            if (callback) {
                callback();
            }
        })
        .catch((error) => {
            Alert.alert("ERROR: " + error);
        });
    }

    _displayDescription = event => {
        if (event.nativeEvent.state === State.ACTIVE) {
            if (this.state.show_description) {
                this.setState({show_description: false});
            } else {
                this.setState({show_description: true});
            }

        }
    }

    endVoting() {

        /* Disable the voting for this song */
        this.setState({voteEnabled: false});
        this.setState({userVoteIndex: -1});

        spotifySDKBridge.getAccessToken((error, result) => {
            if (error) {
                Alert.alert("ERROR: " + error);
            } else {
                const url = "https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/get_next_song";
                fetch(url, {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: qs.stringify({
                        uid: DeviceInfo.getUniqueId(),
                        access_token: result
                    })
                })
                .then((response) => response.json())
                .then((responseJson) => {
                    if (responseJson.length) {
                        this.queue(
                            responseJson.id,
                            responseJson.name,
                            responseJson.image_url,
                            responseJson.artists,
                            responseJson.length
                        );
                        this.getRecommendations(result);
                    } else {
                        Alert.alert("ERROR: " + responseJson);
                    }


                })
                .catch((error) => {
                    Alert.alert("ERROR: " + error);
                });
            }
        });

    }

    nextSong() {
        this.setState({
            activeSong: {
                ...this.state.nextSong,
                time_invoked: Date.now()
            },
            nextSong: {isSet: false}
        });
        this.setState({thumb_status: "neutral"});
        this.setState({votes: {}});


        const track_features_url = "https://api.spotify.com/v1/audio-features/" + this.state.activeSong.id

        /* Set the active track to that which has just been played */
        const set_track_url = "https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/set_track";

        fetch(set_track_url, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: qs.stringify({
                uid: DeviceInfo.getUniqueId(),
                track_id: this.state.activeSong.id,
                time: this.state.activeSong.time_invoked,
                name: this.state.activeSong.name,
                uri: this.state.activeSong.uri,
                artists: this.state.activeSong.artists,
                duration_ms: this.state.activeSong.length,
            })
        })
        .then((response) => response.json())
        .then((responseJson) => {
            /* Send WS packet to aws */
            this.ws.send(JSON.stringify({
                action: "next",
                uid: DeviceInfo.getUniqueId(),
                track: this.state.activeSong
            }));

            clearTimeout(this.timer);
            clearTimeout(this.next_song_timer);
            this.timer = setInterval(() => this.endVoting(), 0.8 * this.state.activeSong.length);
            this.next_song_timer = setInterval(() => this.nextSong(), this.state.activeSong.length);
        })
        .catch((error) => {
            Alert.alert("ERROR: " + error);
        });

        this.getStoredRecommendations();

        fetch("https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/get_description", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: qs.stringify({
                name: this.state.activeSong.name,
                artist: this.state.activeSong.artists,
                track_id: this.state.activeSong.id,
            })
        })
        .then((response) => response.json())
        .then((responseJson) => {
            this.setState({track_description: responseJson});
        })
        .catch((error) => {
            Alert.alert("ERROR: " + error);
        });

    }

    play(id, name, img_url, artists, length) {

        spotifySDKBridge.play("spotify:track:" + id, (error, result) => {
            if (error) {
                Alert.alert("error" + error);
            } else {
                this.setState({
                    activeSong: {
                        isSet: true,
                        id: id,
                        name: name,
                        uri: img_url,
                        artists: artists,
                        length: length,
                        time_invoked: Date.now()
                    },
                    isMusicPlaying: true
                });
                this.setState({thumb_status: "neutral"});

                /* Set timer to last 90% of the currently playing track */
                clearTimeout(this.timer);
                clearTimeout(this.next_song_timer);
                this.timer = setInterval(() => this.endVoting(), 0.8 * length);
                this.next_song_timer = setInterval(() => this.nextSong(), length);

                /* Set the active track to that which has just been played */
                const set_track_url = "https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/set_track";

                fetch(set_track_url, {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: qs.stringify({
                        uid: DeviceInfo.getUniqueId(),
                        track_id: id,
                        time: this.state.activeSong.time_invoked,
                        name: name,
                        uri: img_url,
                        artists: artists,
                        duration_ms: length
                    })
                })
                .catch((error) => {
                    Alert.alert("ERROR: " + error);
                });

                fetch("https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/get_description", {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: qs.stringify({
                        name: this.state.activeSong.name,
                        artist: this.state.activeSong.artists,
                        track_id: this.state.activeSong.id,
                    })
                })
                .then((response) => response.json())
                .then((responseJson) => {
                    this.setState({track_description: responseJson});
                })
                .catch((error) => {
                    Alert.alert("ERROR: " + error);
                });
            }
        });
    }

    queue(id, name, img_url, artists, length) {

        spotifySDKBridge.queue("spotify:track:" + id, (error, result) => {
            if (error) {
                Alert.alert("error" + error);
            } else {
                this.setState({
                    nextSong: {
                        isSet: true,
                        id: id,
                        name: name,
                        uri: img_url,
                        artists: artists,
                        length: length
                    }
                });


            }
        });
    }

    thumbs(status) {

        if (status != this.state.thumb_status) {
            this.setState({thumb_status: status});
            const url = "https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/thumbs";

            fetch(url, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: qs.stringify({
                    uid: DeviceInfo.getUniqueId(),
                    thumb_status: status
                })
            })
            .catch((error) => {
                Alert.alert("Error setting thumb status: " + error);
            });
        }

    }

    componentDidMount = () => {

        this.ws.onopen = () => {
            this.setState({voteEnabled: true});
        };

        this.ws.onmessage = (evt) => {
            var msg = JSON.parse(evt.data);

            if (msg.action == "vote") {

                votes = msg.body;

                let newVotes = Object.assign({}, this.state.votes);

                votes.forEach((item) => {
                    newVotes[item.track_id.S] = parseFloat(item.vote_no.N);
                });

                this.setState({votes: newVotes});

            } else if (msg.action == "next") {
                this.setState({activeSong: msg.body});
            }

        };

        this.ws.onclose = () => {
            Alert.alert("Disconnected from Websocket API.");
            clearTimeout(this.timer);
        }

        spotifySDKBridge.getAccessToken((error, result) => {
            if (error) {
                Alert.alert(error);
            } else {
                this.getRecommendations(result, () => {
                    this.getStoredRecommendations();
                });
            }
        });
    }

    componentWillUnmount() {

        /* Called when react-navigation pops HostLobby component off of navigation stack */

        /* Send HTTP request to delete current lobby from DynamoDB */

        const url = "https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/delete_lobby";

        fetch(url, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: qs.stringify({
                uid: DeviceInfo.getUniqueId()
            })
        })
        .catch((error) => {
            Alert.alert("Error unmounting HostLobby component: " + error);
        });

        clearTimeout(this.timer);
    }

    render() {



        const {navigation} = this.props;
        const uid = DeviceInfo.getUniqueId();

        const lobbyInfo = {
            name: navigation.getParam("name","ERROR RETRIEVING LOBBY NAME"),
            key: navigation.getParam("key", "ERROR RETRIEVING LOBBY KEY"),
            playlist_id: navigation.getParam("playlist_id","ERROR RETRIEVING PLAYLIST ID"),
            chat: (navigation.getParam("chat","ERROR RETRIEVING CHAT STATUS") == "true"),
            lyrics: (navigation.getParam("lyrics","ERROR RETRIEVING LYRICS STATUS") == "true"),
            volume: (navigation.getParam("volume","ERROR RETRIEVING VOLUME STATUS") == "true")
        }

        return (
            <View style={styles.HostLobbyBody}>
                <TapGestureHandler
                    waitFor={this.doubleTapRef}
                    numberOfTaps={2}
                    onHandlerStateChange={this._displayDescription}>
                    <View style={[
                        {width: Dimensions.get("window").width, height: Dimensions.get("window").width},
                        styles.playerView]}>

                        {!this.state.activeSong.isSet && <View style={styles.playTrackPromptView}>
                            <Text style={styles.playTrackPromptText}>Please select a track to be played...</Text>
                        </View>}

                        <View style = {styles.TrackImageView}>

                            {this.state.activeSong.isSet && <Image
                                style={{
                                    position: "absolute",
                                    width: Dimensions.get("window").width,
                                    height: Dimensions.get("window").width,
                                    left: 0,
                                    top: 0,
                                    zIndex: 100
                                }}
                                source = {require("./img/black-shadow-png-4-down.png")}
                            />}

                            {this.state.activeSong.isSet && <Image
                                style={{
                                    position: "absolute",
                                    width: Dimensions.get("window").width,
                                    height: (Dimensions.get("window").width * 0.15) + (Dimensions.get("window").width * 1.15),
                                    left: 0,
                                    top: -(Dimensions.get("window").width * 0.15),
                                    zIndex: 100
                                }}
                                source = {require("./img/black-shadow-png-4.png")}
                            />}


                            {this.state.activeSong.isSet && <View style = {styles.trackImageWrapper}>

                            <Image
                                style = {[
                                    {width: 1.4 * Dimensions.get("window").width,
                                    height: 1.4 * Dimensions.get("window").width,
                                    top: -0.2 * Dimensions.get("window").width,
                                    left: -0.2 * Dimensions.get("window").width
                                    },
                                    styles.playlistImage]}
                                source = {{uri: this.state.activeSong.uri}}
                                blurRadius={10}
                            />
                            </View>}

                            {this.state.activeSong.isSet && <View style={[
                                styles.smallImage,
                                {top: (Dimensions.get("window").width - 190) / 2},
                                {left: (Dimensions.get("window").width - 200) / 2}
                            ]}>
                                {!this.state.show_description && <Image
                                    style={styles.smallImageContent}
                                    source={{uri: this.state.activeSong.uri}}
                                    >
                                </Image>}

                                {this.state.show_description && <ScrollView
                                    style={styles.smallImageContent}
                                    source={{uri: this.state.activeSong.uri}}
                                    >
                                    <Text style={styles.descriptionText}>{this.state.track_description.description}</Text>
                                </ScrollView>}
                            </View>}
                        </View>

                        <View style = {styles.lobbyInfo}>
                            <Text style = {styles.lobbyName}>{lobbyInfo.name}</Text>
                            <Text style = {styles.lobbyKey}>Join with: {lobbyInfo.key}</Text>
                        </View>

                        <View style= {styles.trackInfo}>
                            {this.state.isMusicPlaying && <Text style={styles.trackName} numberOfLines={1}>{this.state.activeSong.name}</Text>}
                            {this.state.isMusicPlaying && <Text style={styles.trackArtists} numberOfLines={1}>{this.state.activeSong.artists}</Text>}
                        </View>

                    </View>
                </TapGestureHandler>

                <View style = {[
                    {width: Dimensions.get("window").width, height:  0.15 * Dimensions.get("window").width},
                    styles.SongInfo]}>

                    <View style = {styles.thumbsDownView}>
                        <TouchableWithoutFeedback
                            onPress = {() => {
                                this.thumbs("down");
                            }}
                        >
                            <Image
                                style = {styles.thumbsDown}
                                source = {(this.state.thumb_status == "down") ? require("./img/thumbs-down-active.png") : require("./img/thumbs-down-white.png")}
                            />
                        </TouchableWithoutFeedback>
                    </View>


                    <View style = {styles.SongInfoView}>

                        <ProgressBar
                            enabled = {this.state.activeSong.isSet}
                            time = {this.state.activeSong.length}
                            factor = {500}
                            length = {200}
                            height = {5}
                            barColor = {"#ffffff"}
                            progressColor = {"#cc5555"}
                            time_invoked = {(this.state.activeSong.isSet) ? this.state.activeSong.time_invoked : Date.now()}
                        >
                        </ProgressBar>

                    </View>


                    <View style = {styles.thumbsUpView}>
                        <TouchableWithoutFeedback
                            onPress = {() => {
                                this.thumbs("up");
                            }}
                        >
                            <Image
                                style = {styles.thumbsUp}
                                source = {(this.state.thumb_status == "up") ? require("./img/thumbs-up-active.png") : require("./img/thumbs-up-white.png")}
                            />
                        </TouchableWithoutFeedback>
                    </View>

                </View>

                <View style = {[
                    {width: Dimensions.get("window").width, height: Dimensions.get("window").height - (1.35 * Dimensions.get("window").width)},
                    styles.Recommendations
                ]}>

                    {this.state.voteEnabled && !this.state.recommendations_ready && <View style={styles.recommendationPlaceholder}>
                        <Text style={styles.defaultRecommendationText}>Loading Recommendations...</Text>
                    </View>}

                    {!this.state.voteEnabled && this.state.nextSong.isSet &&
                        <View style={styles.recommendationPlaceholder}>
                            <Text style={styles.defaultRecommendationText}>Coming up next:</Text>
                            <Text style={styles.nextSongText}>{this.state.nextSong.name} - {this.state.nextSong.artists}</Text>
                        </View>}

                    {this.state.voteEnabled && <FlatList
                        data = {this.state.recommendations}
                        extraData = {this.state}
                        renderItem = {({item, index}) => (
                            <TouchableOpacity
                                onPress = {() => {

                                    if (!this.state.activeSong.isSet) {
                                        this.play(item.M.track_id.S, item.M.track_name.S, item.M.track_cover_image_url.S, item.M.track_artists.S, parseInt(item.M.track_duration_ms.N))
                                    } else {
                                        if (this.state.userVoteIndex != index) {

                                            let newVotes = Object.assign({}, this.state.votes);

                                            if (this.state.current_vote_track) {
                                                newVotes[this.state.current_vote_track] = parseFloat((parseFloat(newVotes[this.state.current_vote_track]) || 0) - parseFloat(this.state.userVoteWeighting));
                                            }
                                            newVotes[item.M.track_id.S] = parseFloat((parseFloat(newVotes[item.M.track_id.S]) || 0) + parseFloat(this.state.userVoteWeighting));

                                            this.setState({votes: newVotes});
                                            this.setState({current_vote_track: item.M.track_id.S});

                                            this.setState({userVoteIndex: index});
                                            this.ws.send(JSON.stringify({
                                                action: "vote",
                                                uid: DeviceInfo.getUniqueId(),
                                                track_id: item.M.track_id.S
                                            }));
                                        } else {
                                            Alert.alert("You cannot vote for the same track twice...");
                                        }

                                    }
                                }}
                                style = {[
                                    styles.recommendation
                                ]}
                            >
                                <Track
                                    trackid = {item.M.track_id.S}
                                    name = {item.M.track_name.S}
                                    imageurl = {item.M.track_cover_image_url.S}
                                    artists = {item.M.track_artists.S}
                                    votes = {(this.state.votes[item.M.track_id.S]) ? this.state.votes[item.M.track_id.S] : 0}
                                    isArtistString = {true}
                                    isSelected = {this.state.userVoteIndex == index}
                                    userVoteWeighting = {this.state.userVoteWeighting}
                                />

                            </TouchableOpacity>
                        )}
                        keyExtractor = {item => item.M.track_id.S}

                    />}
                </View>

            </View>
        );
    }
};

const styles = StyleSheet.create({
    HostLobbyBody: {
        flex: 1,
        backgroundColor: "#ffffff",
        justifyContent: "space-around"
    },

    playTrackPromptView: {
        position: "absolute",
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    playTrackPromptText: {
        textAlign: "center",
        color: "#ffffff",
        fontSize: 25
    },
    playerView: {
        position: "relative",
        justifyContent: "space-between",
        backgroundColor: "#666666"
    },

    lobbyInfo: {
        alignItems: "stretch",
        height: 50,
        justifyContent: "flex-start",
        textAlign: "center",
        color: "#151515",
        fontSize: 20,
        padding: 5,
        zIndex: 3
    },
    lobbyName: {
        color: "#ffffff",
        fontWeight: "bold",
        textAlign: "center",
        fontSize: 25,
        marginTop: 10,
        margin: 1
    },
    lobbyKey: {
        textAlign: "center",
        color: "#bbbbbb",
        fontSize: 18,
        margin: 1
    },

    trackInfo: {
        alignItems: "stretch",
        height: 50,
        justifyContent: "flex-end",
        textAlign: "left",
        color: "#151515",
        padding: 5,
        zIndex: 3
    },
    trackName: {
        color: "#ffffff",
        fontWeight: "bold",
        textAlign: "left",
        fontSize: 25
    },
    trackArtists: {
        color: "#bbbbbb",
        fontSize: 18,
        textAlign: "left"
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
    smallImage: {
        position: "absolute",
        width: 200,
        height: 200,
        zIndex: 101,
        shadowColor: "#000000",
        shadowOpacity: 0.8,
        shadowRadius: 10
    },
    smallImageContent: {
        position: "absolute",
        width: 200,
        height: 200,
        top: 0, left: 0,
        padding: 5
    },
    descriptionText: {
        color: "#ffffff",
        alignSelf: "stretch",
        textAlign: "center",
        fontWeight: "bold"
    },

    SongInfo: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2,
    },

    Recommendations: {
        flex: 2.5,
        backgroundColor: "#cccccc",
        zIndex: 3
    },
    recommendationPlaceholder: {
        flex: 1,
        justifyContent: "center",
        alignItems: "stretch"
    },
    defaultRecommendationText: {
        textAlign: "center",
        fontSize: 18
    },
    nextSongText: {
        textAlign: "center",
        color: "#ffffff",
        fontSize: 20
    },

    thumbsUp: {
        width: 40,
        height: 40,
        marginTop: 6
    },
    thumbsDown: {
        width: 40,
        height: 40,
        marginBottom: 6
    },
    thumbsUpView: {
        flex: 1,
        alignSelf: "flex-start",
        justifyContent: "center",
        alignItems: "center"
    },
    thumbsDownView: {
        flex: 1,
        alignSelf: "flex-end",
        justifyContent: "flex-end",
        alignItems: "center"
    },
    SongInfoView: {
        flex: 3,
        justifyContent: "center",
        alignItems: "center"
    }
});
