import React, {Component} from "react";
import {
    View,
    Alert,
    Touchable
} from "react-native";

export default class TouchableTrack extends Component {

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
                    <Image
                        style = {{
                            width: 64,
                            height: 64
                        }}
                        source = {{uri: this.props.imageurl}}
                    />
                </View>

                <View style = {styles.infoBox}>
                    <Text>{this.props.name}</Text>
                    <Text>{this.getArtistString(this.props.trackartists)}</Text>
                </View>

                <View>
                    <View style = {styles.voteBox}>
                        <Text>{this.props.votes}</Text>
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
        alignItems: "stretch"
    },

    imageBox: {
        flex: 1,
        backgroundColor: "#333333"
    },

    infoBox: {
        flex: 4,
        backgroundColor: "#666666"
    },

    voteBox: {
        flex: 1,
        backgroundColor: "#999999"
    }
});
