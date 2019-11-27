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
    Platform
    } from 'react-native';
window.navigator.userAgent = 'react-native';
import io from 'socket.io-client/dist/socket.io';
import {createStackNavigator, createAppContainer} from "react-navigation";
import DeviceInfo from "react-native-device-info";

var spotifySDKBridge = NativeModules.SpotifySDKBridge;



export default class HostLobby extends Component {


    getRecommendations(callback) {
        var recs = fetch("http://harrys-macbook-pro.local:3000/get_recommendations", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                uid: DeviceInfo.getUniqueId()
            })
        })
        .then((response) => {
            return response;
        })
        .catch((error) => {
            Alert.alert("Error getting recommended tracks: " + error);
        });
    }

    constructor(props) {
        super(props);
        this.state = {
            recommendations: []
        }
        this.getRecommendations(() => {
            Alert.alert(this.state.recommendations);
        });
        var tracks = this.getRecommendations();
        Alert.alert(tracks);
        this.setState({recommendations: tracks});
        Alert.alert(this.state.recommendations);
    }



    render() {
        const {navigate} = this.props.navigation;
        return (
            <View style={styles.HostLobbyBody}>

                <View style= {styles.HostLobbyHeader}>
                    <Text>Lobby Name: Lobby Key</Text>
                </View>

                <View style = {styles.TrackImageView}>

                </View>

                <View style = {styles.SongInfo}>
                    <Text>Song Name - Artist (thumbs-up) (thumbs-down)</Text>
                </View>

                <View style = {styles.Recommendations}>

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
