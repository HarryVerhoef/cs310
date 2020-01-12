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


function Recommendation({id, title, selected, artists, onSelect, votes}) {

    return (
        <TouchableOpacity
            onPress = {() => onSelect(id)}
            style = {[
                styles.recommendation,
                {backgroundColor: selected ? "#6e3b6e" : "#f9c2ff"}
            ]}
        >
            <View style = {styles.songInfoView}>
                <Text style = {styles.recommendationTitle}>{title}</Text>
                <Text style = {styles.recommendationArtists}>{getArtistString(artists)}</Text>
            </View>

            <View style = {styles.voteInfoView}>
                <Text>{(votes) ? votes[id] : "0"}</Text>
            </View>

        </TouchableOpacity>
    );
}

export default class HostLobby extends Component {

    ws = new WebSocket("https://5b5gjj48d4.execute-api.us-west-2.amazonaws.com/epsilon-2");

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
            voteEnabled: false,
            votes: {}
        }
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
            Alert.alert(responseJson);
        })
        catch((error) => {
            Alert.alert("ERROR " + error);
        });
        
    }

    play(id, name, img_url, artists, length, callback) {
        spotifySDKBridge.play("spotify:track:" + id, (error, result) => {

            if (error) {
                Alert.alert("error" + error);
            } else {
                this.setState({
                    activeSong: {
                        isSet: true,
                        name: name,
                        uri: img_url,
                        artists: getArtistString(artists),
                        length: length
                    }
                });

                /* Set timer to last 90% of the currently playing track */
                this.timer = setInterval(() => this.endVoting(), 0.9 * length);

            }

            callback();

        });
    }

    componentDidMount = () => {

        this.ws.onopen = () => {
            this.setState({voteEnabled: true});
        };

        this.ws.onmessage = (evt) => {
            // Received a message from lambda, probably a vote message
            var votes = JSON.parse(evt.data);
            // this.state.recommendations.forEach((item) => {})
            newVotes = this.state.votes;
            votes.forEach(item => {
                newVotes[item.track_id.S] = item.vote_no.N;
            });

            this.setState({votes: newVotes});
        };

        this.ws.onclose = () => {
            Alert.alert("Disconnected from Websocket API.");
        }

        const url = "https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/get_recommendations";

        spotifySDKBridge.getAccessToken((error, result) => {
            if (error) {
                Alert.alert(error);
            } else {
                fetch(url, {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: qs.stringify({
                        "uid": DeviceInfo.getUniqueId(),
                        "access_token": result
                    })
                })
                .then((response) => response.json())
                .then((responseJson) => {
                    this.setState({recommendations: responseJson});
                })
                .catch((error) => {
                    Alert.alert("ERROR: " + error);
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

                <View style= {styles.HostLobbyHeader}>
                    <Text>{lobbyInfo.name}: {lobbyInfo.key}</Text>
                </View>

                <View style = {styles.TrackImageView}>
                    {this.state.activeSong.isSet && <Image
                        style = {styles.playlistImage}
                        source = {{uri: this.state.activeSong.uri}}
                    />}
                </View>

                <View style = {styles.SongInfo}>
                    <Text>{this.state.activeSong.name} - {this.state.activeSong.artists} (thumbs-up) (thumbs-down)</Text>
                </View>

                <View style = {styles.Recommendations}>
                    {this.state.voteEnabled && <FlatList
                        data = {this.state.recommendations}
                        extraData = {this.state}
                        renderItem = {({item}) => (
                            <TouchableOpacity
                                onPress = {() => {

                                    if (!this.activeSong.isSet) {
                                        this.play(item.id, item.album.images[0].url, item.artists, item.duration_ms)
                                    } else {
                                        this.ws.send(JSON.stringify({
                                            action: "vote",
                                            uid: DeviceInfo.getUniqueId(),
                                            track_id: item.id
                                        }));
                                    }
                                }}
                                style = {[
                                    styles.recommendation
                                ]}
                            >
                                <View style = {styles.songInfoView}>
                                    <Text style = {styles.recommendationTitle}>{item.title}</Text>
                                    <Text style = {styles.recommendationArtists}>{getArtistString(item.artists)}</Text>
                                </View>

                                <View style = {styles.voteInfoView}>
                                    <Text>{(this.state.votes[item.id]) ? this.state.votes[item.id] : "0"}</Text>
                                </View>

                            </TouchableOpacity>
                        )}
                        keyExtractor = {item => item.id}

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
        flex: 1,
        backgroundColor: "#333333",

    },

    TrackImageView: {
        flex: 3,
        backgroundColor: "#666666"
    },

    SongInfo: {
        flex: 1,
        backgroundColor: "#999999"
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
