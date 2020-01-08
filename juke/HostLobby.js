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


function Recommendation({id, title, selected, artists, onSelect}) {

    var newArr = artists.map(function(val, index) {
        return val.name;
    });

    Alert.alert(newArr);

    var artistString = newArr.join(", ");

    return (
        <TouchableOpacity
            onPress = {() => onSelect(id)}
            style = {[
                styles.recommendation,
                {backgroundColor: selected ? "#6e3b6e" : "#f9c2ff"}
            ]}
        >
            <Text style = {styles.recommendationTitle}>{title}</Text>
            <Text style = {styles.recommendationArtists}>{artistString}</Text>

        </TouchableOpacity>
    );
}

export default class HostLobby extends Component {


    async setRecommendations() {


        const url = "https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/get_recommendations";

        Alert.alert("getRecommendations");
        let response = await fetch(url, {
            method: "post",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                uid: DeviceInfo.getUniqueId()
            })
        });
        // let res = await response.json();
        // this.setState({recommendations: res});
        Alert.alert(response);
        return response;
    }

    constructor(props) {
        super(props);
        this.state = {
            recommendations: [],
            lobby: {},
            selected: {}
        }
    }

    componentDidMount = () => {

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



        // this.setRecommendations()
        // .then((response) => {
        //     if (response.status == 200) { // OK
        //         Alert.alert("holla");
        //         socket.emit("getRecommendations", DeviceInfo.getUniqueId());
        //         socket.on("recommendations", (tracks) => {
        //             Alert.alert(tracks);
        //             this.setState({recommendations: tracks});
        //         });
        //     } else if (response.status == 500) { // Internal server error
        //         Alert.alert("Sorry, there was an internal server error when requestin lobby recommendations.");
        //     } else {
        //         Alert.alert("Unknown error when retrieving lobby recommendations.")
        //     }
        // })
        // .catch((error) => {
        //     Alert.alert(error.message);
        // });


        // const url = "http://harrys-macbook-pro.local:8081/get_recommendations";
        //
        // fetch(url, {
        //     method: "post",
        //     headers: {
        //         "Content-Type": "application/json"
        //     },
        //     body: JSON.stringify({
        //         uid: DeviceInfo.getUniqueId()
        //     })
        // })
        // .then(() => {
        //     Alert.alert("holla");
        //     socket.emit("getRecommendations", DeviceInfo.getUniqueId());
        //     socket.on("recommendations", (tracks) => {
        //         Alert.alert(tracks);
        //         this.setState({recommendations: tracks});
        //     });
        // })
        // .catch((error) => {
        //     Alert.alert("ERROR");
        // });


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

        onSelect = (id, url) => {

        }




        return (
            <View style={styles.HostLobbyBody}>

                <View style= {styles.HostLobbyHeader}>
                    <Text>{lobbyInfo.name}: {lobbyInfo.key}</Text>
                </View>

                <View style = {styles.TrackImageView}>
                    {this.state.activeSongURL && <Image
                        style = {styles.playlistImage}
                        source = {{uri: this.state.activeSongURL}}
                    />}
                </View>

                <View style = {styles.SongInfo}>
                    <Text>Song Name - Artist (thumbs-up) (thumbs-down)</Text>
                </View>

                <View style = {styles.Recommendations}>
                    <FlatList
                        data = {this.state.recommendations}
                        renderItem = {({item}) => (
                            <Recommendation
                                id = {item.id}
                                title = {item.name}
                                artists = {item.artists}
                                selected={this.state.selected[item.id] ? true : false}
                                onSelect={() => {
                                    /* @TODO: Need to implement semaphore in play method */
                                    spotifySDKBridge.play("spotify:track:" + item.id, (error, result) => {
                                        if (error) {
                                            Alert.alert("error" + error);
                                        } else {
                                            Alert.alert("result" + result);
                                        }
                                        this.setState({
                                            activeSongID: item.id,
                                            activeSongURL: item.album.images[0].url
                                        });
                                    });
                                }}
                            />
                        )}
                        keyExtractor = {item => item.id}
                    />
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
    }
});
