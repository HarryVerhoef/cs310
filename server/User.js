class User {

    constructor(socket) {
        this.socket = socket;
    }

    setUserObject(spotify_user_object) {
        this.spotify_user_object = spotify_user_object;
    }

    getUserObject() {
        return this.spotify_user_object;
    }

    setAccessToken(access_token) {
        this.acess_token = access_token;
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
