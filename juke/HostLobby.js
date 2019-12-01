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
import io from 'socket.io-client/dist/socket.io';
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
            <Text style = {styles.recommendationTitle}>title</Text>
            <Text style = {styles.recommendationArtists}>{artists.join()}</Text>

        </TouchableOpacity>
    );
}

export default class HostLobby extends Component {


    async getRecommendations() {


        const url = "http://harrys-macbook-pro.local:3000/get_recommendations";

        try {
            Alert.alert("getRecommendations");
            let response = await fetch(url, {
                method: "post",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    uid: DeviceInfo.getUniqueId()
                })
            });
            let res = await response.json();
            Alert.alert(res);
            return res;
        } catch (error) {
            Alert.alert("error at getRecommendations: " + error);
            return error;
        }
    }

    constructor(props) {
        super(props);
        this.state = {
            recommendations: [],
            lobby: {},
            selected: {}
        }
    }

    componentDidMount() {

        this.getRecommendations().then((response) => {
            this.setState({recommendations: response});
        });

    }



    render() {
        const {navigate} = this.props.navigation;
        const uid = DeviceInfo.getUniqueId();


        socket.emit("getLobbyInfo", uid);
        socket.on("lobbyInfo", (data) => {
            this.setState({lobby: data});
            // Alert.alert(data);
            // Alert.alert(this.state.tracks);
        });

        onSelect = (id) => {
            if (this.state.selected[id]) {
                delete this.state.selected[id];
            } else {
                this.state.selected[id] = true;
            }
        }


        return (
            <View style={styles.HostLobbyBody}>

                <View style= {styles.HostLobbyHeader}>
                    <Text>{this.state.lobby.name}: {this.state.lobby.key}</Text>
                </View>

                <View style = {styles.TrackImageView}>
                    {typeof this.state.lobby.playlists != "undefined" && <Image
                        style = {styles.playlistImage}
                        source = {{
                            uri: "http://harrys-macbook-pro.local:3000/get-image",
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
                                artists = {item.artists}
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
