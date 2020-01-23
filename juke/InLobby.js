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
    FlatList
    } from 'react-native';
import ProgressBar from "./ProgressBar.js";
import Track from "./Track.js";
window.navigator.userAgent = 'react-native';
import {createStackNavigator, createAppContainer} from "react-navigation";
import DeviceInfo from "react-native-device-info";
import qs from "query-string";

var spotifySDKBridge = NativeModules.SpotifySDKBridge;




function getArtistString(artists) {
    var newArr = artists.map(function(val, index) {
        return val.name;
    });

    return newArr.join(", ");
}

export default class InLobby extends Component {

    ws = new WebSocket("https://5b5gjj48d4.execute-api.us-west-2.amazonaws.com/epsilon-2?uid=" + DeviceInfo.getUniqueId());

    constructor(props) {
        super(props);
        const {navigate} = this.props;

        var newVotes = {};
        this.props.navigation.state.params.votes.forEach((item) => {
            newVotes[item.track_id.S] = item.vote_no.N;
        });

        const actSong = this.props.navigation.state.params.active_song;

        Alert.alert(actSong);

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
            votes: newVotes
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
                recommendations: responseJson.L,
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

        /* Fetch final vote numbers from lambda */

        const url = "https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/get_next_song";

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
        .then((response) => response.json())
        .then((responseJson) => {
            // Handle final vote response
            // Alert.alert(responseJson);

            var max = -1;
            var nextSong = "";

            responseJson.forEach((item) => {
                if (item.vote_no.N > max) {
                    max = item.vote_no.N;
                    nextSong = item.track_id.S;
                }
            });

            this.setState({
                activeSong: {
                    isSet: true,
                    name: responseJson.name,
                    uri: responseJson.image_url,
                    artists: responseJson.artists,
                    length: responseJson.length,
                    time_invoked: responseJson.time_invoked
                }
            });
        })
        .catch((error) => {
            Alert.alert("ERROR " + error);
        });

    }

    componentDidMount = () => {

        this.ws.onopen = () => {
            this.setState({ voteEnabled: true });
        };

        this.ws.onmessage = (evt) => {
            // Received a message from lambda, probably a vote message
            var votes = JSON.parse(evt.data);
            // this.state.recommendations.forEach((item) => {})
            newVotes = this.state.votes;
            votes.forEach((item) => {
                newVotes[item.track_id.S] = item.vote_no.N;
            });

            this.setState({votes: newVotes});
        };

        this.ws.onclose = () => {
            Alert.alert("Disconnected from Websocket API.");
            clearTimeout(this.timer);
        }

        this.getRecommendations();




    }

    componentWillUnmount() {

        /* Called when react-navigation pops HostLobby component off of navigation stack */
        clearTimeout(this.timer);
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

                <View style= {styles.HostLobbyHeader}>
                    <View style = {styles.lobbyNameView}>
                        <Text style = {styles.lobbyName}>{lobbyInfo.name}</Text>
                    </View>
                    <View style = {styles.lobbyKeyView}>
                        <Text style = {styles.lobbyKey}>Join with: {lobbyInfo.key}</Text>
                    </View>
                </View>

                <View style = {styles.TrackImageView}>
                    {this.state.activeSong.isSet && <Image
                        style = {styles.playlistImage}
                        source = {{uri: this.state.activeSong.uri}}
                    />}
                </View>

                <View style = {styles.SongInfo}>
                    <Text>{this.state.activeSong.name} - {this.state.activeSong.artists}</Text>
                    <ProgressBar
                        enabled = {this.state.activeSong.isSet}
                        time = {this.state.activeSong.length}
                        factor = {500}
                        length = {300}
                        height = {10}
                        barColor = {"#ffffff"}
                        progressColor = {"#cc5555"}
                        time_invoked = {(this.state.activeSong.isSet) ? this.state.activeSong.time_invoked : Date.now()}
                    >
                    </ProgressBar>
                </View>

                <View style = {styles.Recommendations}>
                    {this.state.voteEnabled && <FlatList
                        data = {this.state.recommendations}
                        extraData = {this.state}
                        renderItem = {({item}) => (
                            <TouchableOpacity
                                onPress = {() => {
                                    this.ws.send(JSON.stringify({
                                        action: "vote",
                                        uid: DeviceInfo.getUniqueId(),
                                        track_id: item.M.track_id.S
                                    }));
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
                                    votes = {this.state.votes[item.M.track_id.S]}
                                    isArtistString = {true}
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

    HostLobbyHeader: {
        flexDirection: "row",
        flex: 1,
        backgroundColor: "#ffffff",
        alignItems: "center",
        justifyContent: "space-around"
    },

    lobbyNameView: {
        backgroundColor: "#2299dd",
        borderRadius: 10,
        padding: 10,
        margin: 10
    },

    lobbyKeyView: {
        backgroundColor: "#2299dd",
        borderRadius: 10,
        padding: 10,
        margin: 10
    },

    lobbyName: {
        color: "#151515",
        fontSize: 20
    },

    lobbyKey: {
        color: "#151515",
        fontSize: 20
    },

    TrackImageView: {
        flex: 3,
        backgroundColor: "#666666",
        justifyContent: "center",
        alignItems: "center"
    },

    SongInfo: {
        flex: 1,
        backgroundColor: "#999999",
        justifyContent: "center",
        alignItems: "center"
    },

    Recommendations: {
        flex: 3,
        backgroundColor: "#cccccc"
    },

    playlistImage: {
        width: 200,
        height: 200
    }
});
