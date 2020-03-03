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
    TouchableWithoutFeedback,
    TouchableHighlight,
    TouchableOpacity,
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




function getArtistString(artists) {
    var newArr = artists.map(function(val, index) {
        return val.name;
    });

    return newArr.join(", ");
}

export default class InLobby extends Component {

    static navigationOptions = {
        header: null
    }

    ws = new WebSocket("https://5b5gjj48d4.execute-api.us-west-2.amazonaws.com/epsilon-2?uid=" + DeviceInfo.getUniqueId());

    constructor(props) {
        super(props);
        const {navigate} = this.props;

        var newVotes = {};
        this.props.navigation.state.params.votes.forEach((item) => {
            newVotes[item.track_id.S] = item.vote_no.N;
        });

        const actSong = this.props.navigation.state.params.active_song;

        const activeSong = {
            isSet: true,
            name: actSong.name.S,
            uri: actSong.image_url.S,
            artists: actSong.artists.S,
            length: actSong.length.N,
            time_invoked: actSong.time_invoked.N
        };

        this.state = {
            recommendations: [],
            lobby: {},
            selected: {},
            activeSong: activeSong,
            voteEnabled: false,
            votes: newVotes,
            thumb_status: "neutral",
            userVoteWeighting: 1,
            userVoteIndex: -1,
            track_description: "Loading description...",
            show_description: false,
            nextSong: {isSet: false}
        }
    }

    getRecommendations() {

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
                userVoteWeighting: responseJson.user_weighting,
                voteEnabled: true
            });
        })
        .catch((error) => {
            Alert.alert("ERROR: " + error);
        });

    }

    endVoting() {

        /* Disable the voting for this song */
        this.setState({voteEnabled: false});
        this.setState({userVoteIndex: -1});
        this.setState({nextSong: {isSet: true}})

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

    _displayDescription = event => {
        if (event.nativeEvent.state === State.ACTIVE) {
            if (this.state.show_description) {
                this.setState({show_description: false});
            } else {
                this.setState({show_description: true});
            }

        }
    }

    componentDidMount = () => {

        this.ws.onopen = () => {
            this.setState({ voteEnabled: true });
            clearTimeout(this.votingTimer);
            this.votingTimer = setInterval(() => this.endVoting(), (0.8 * this.state.activeSong.length) - (Date.now() - this.state.activeSong.time_invoked));
        };

        this.ws.onmessage = (evt) => {
            var msg = JSON.parse(evt.data);


            if (msg.action == "vote") {

                votes = msg.body;

                let newVotes = Object.assign({}, this.state.votes);

                votes.forEach((item) => {
                    newVotes[item.track_id.S] = item.vote_no.N;
                });

                this.setState({votes: newVotes});
            } else if (msg.action == "next") {
                this.setState({activeSong: msg.body});
                this.setState({userVoteIndex: -1});
                this.setState({thumb_status: "neutral"});
                this.setState({votes: {}});

                clearTimeout(this.votingTimer);
                end_voting_time = 0.8 * msg.body.length;
                this.votingTimer = setInterval(() => this.endVoting(), end_voting_time);

                this.getRecommendations();
                this.getDescription();


            }
        };

        this.ws.onclose = () => {
            Alert.alert("Disconnected from Websocket API.");
        }

        this.getRecommendations();
        this.getDescription();

    }

    componentWillUnmount() {

        /* Called when react-navigation pops HostLobby component off of navigation stack */

    }

    getDescription() {
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

    render() {

        const uid = DeviceInfo.getUniqueId();
        const {navigation} = this.props;

        const lobbyInfo = {
            name: this.props.navigation.state.params.lobby_name,
            key: this.props.navigation.state.params.lobby_key,
            chat: (this.props.navigation.state.params.chat == "true"),
            lyrics: (this.props.navigation.state.params.lyrics == "true"),
            volume: (this.props.navigation.state.params.volume == "true")
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
                                {top: (Dimensions.get("window").width - 170) / 2},
                                {left: (Dimensions.get("window").width - 180) / 2}
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
                            <Text style={styles.trackName} numberOfLines={1}>{this.state.activeSong.name}</Text>
                            <Text style={styles.trackArtists} numberOfLines={1}>{this.state.activeSong.artists}</Text>
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


                    {!this.state.voteEnabled && this.state.nextSong.isSet &&
                    <View style={styles.recommendationPlaceholder}>
                        <Text style={styles.defaultRecommendationText}>Please wait for the next track...</Text>
                    </View>}

                    {this.state.voteEnabled && <FlatList
                        data = {this.state.recommendations}
                        extraData = {this.state}
                        renderItem = {({item, index}) => (
                            <TouchableOpacity
                                onPress = {() => {

                                        if (this.state.userVoteIndex != index) {

                                            let newVotes = Object.assign({}, this.state.votes);

                                            if (this.state.current_vote_track) {
                                                newVotes[this.state.current_vote_track] = parseInt((parseInt(newVotes[this.state.current_vote_track]) || 0) - parseInt(this.state.userVoteWeighting));
                                            }
                                            newVotes[item.M.track_id.S] = parseInt((parseInt(newVotes[item.M.track_id.S]) || 0) + parseInt(this.state.userVoteWeighting));

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
                                }
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
        height: 70,
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
        marginTop: 25,
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
        width: 180,
        height: 180,
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
