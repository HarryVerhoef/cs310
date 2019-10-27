class User {

    constructor(uid) {
        this.uid = uid;
    }

    setUserObject(spotify_user_object) {
        this.spotify_user_object = spotify_user_object;
    }

    getUserObject() {
        return this.spotify_user_object;
    }

    setAccessToken(access_token) {
        this.access_token = access_token;
    }

    getAccessToken() {
        return this.access_token;
    }

    setPlaylists(playlists) {
        this.playlists = playlists;
    }

    getPlaylists() {
        return this.playlists;
    }
}

module.exports.User = User;
