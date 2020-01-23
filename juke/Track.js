import React, {Component} from "react";
import {
    View,
    Text,
    Alert,
    Touchable,
    StyleSheet,
    Image
} from "react-native";

export default class Track extends Component {

    constructor(props) {
        super(props);
    };

    componentDidMount() {
        // this.updateItem();
    };

    componentDidUpdate(prevProps) {
        // if (prevProps != this.state.props) {
        //     this.updateItem();
        // }
    }

    updateItem() {
        this.setState({
            id: this.props.trackid,
            name: this.props.name,
            image_url: this.props.imageurl,
            votes: this.props.votes
        });
    }


    getArtistString(artists) {
        var newArr = artists.map(function(val, index) {
            return val.name;
        });

        return newArr.join(", ");
    }

    /* PROPS:
    ** width
    ** height
    ** track_id
    ** track_name
    ** image_url
    ** artists
    ** length
    **
    **
    */



    render() {

        return (
            <View style = {styles.trackContainer}>

                <View style = {styles.imageBox}>
                    <View style = {styles.imageView}>
                        <Image
                            style = {{
                                width: 50,
                                height: 50,
                                padding: 10
                            }}
                            source = {{uri: this.props.imageurl}}
                        />
                    </View>
                </View>

                <View style = {styles.infoBox}>
                    <Text>{this.props.name}</Text>
                    <Text>{(this.props.isArtistString) ? this.props.artists : this.getArtistString(this.props.artists)}</Text>
                </View>

                <View style = {styles.voteBox}>
                    <View style = {styles.voteView}>
                        <Text style = {styles.voteText}>{(this.props.votes) ? this.props.votes : "0"}</Text>
                    </View>
                </View>

            </View>
        )

    };
};

const styles = StyleSheet.create({

    trackContainer: {
        flexDirection: "row",
        flex: 1,
        alignSelf: "stretch",
        alignItems: "stretch",
        backgroundColor: "#ffffff"
    },

    imageBox: {
        flex: 1,
        alignContent: "center"
    },

    imageView: {
        padding: 5,
        alignItems: "center"
    },

    infoBox: {
        flex: 4
    },

    voteBox: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center"
    },

    voteView: {
        width: 50,
        height: 50,
        padding: 5,
        justifyContent: "center",
        backgroundColor: "#494949",
        borderRadius: 10
    },

    voteText: {
        alignSelf: "center",
        color: "#ffffff"
    }
});
