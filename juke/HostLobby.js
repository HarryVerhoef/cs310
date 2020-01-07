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

var spotifySDKBridge = NativeModules.SpotifySDKBridge;


function Recommendation({id, title, selected, artists, onSelect}) {
    return (
        <TouchableOpacity
            onPress = {() => onSelect(id)}
            style = {[
                styles.recommendation,
                {backgroundColor: selected ? "#6e3b6e" : "#f9c2ff"}
            ]}
        >
            <Text style = {styles.recommendationTitle}>{title}</Text>
            <Text style = {styles.recommendationArtists}>{artists}</Text>

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

        this.setState({lobby: this.props.navigation.state.params.lobby});

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
        const {navigate} = this.props.navigation;
        const params
        const uid = DeviceInfo.getUniqueId();

        onSelect = (id) => {
            if (this.state.selected[id]) {
                delete this.state.selected[id];
            } else {
                this.state.selected[id] = true;
            }
        }

        Alert.alert(this.props.navigation.state.params);



        return (
            <View style={styles.HostLobbyBody}>

                <View style= {styles.HostLobbyHeader}>
                    <Text>{this.state.lobby.name}: {this.state.lobby.key}</Text>
                </View>

                <View style = {styles.TrackImageView}>
                    {typeof this.state.lobby.playlists != "undefined" && <Image
                        style = {styles.playlistImage}
                        source = {{
                            uri: "https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/get-image",
                            method: "POST",
                            headers: {
                                Pragma: "no-cache"
                            },
                            body: this.state.lobby.playlist.images[0]
                        }}
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
                                artists = {item.artists.join()}
                                selected={this.state.selected[item.id] ? true : false}
                                onSelect={onSelect(item.id)}
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
