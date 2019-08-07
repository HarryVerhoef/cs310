/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Fragment} from 'react';
import {
    View,
    StyleSheet,
    Text,
    SpotifyBridge
} from 'react-native';

const App = () => {
    return (
        <View style={styles.body}>
            <Text style={styles.title}>asd</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    body: {
        flex: 1,

        backgroundColor: "#151515",
        justifyContent: "center"
    },
    title: {
        textAlign: "center",
        color: "#29d"
    }
});

export default App;
