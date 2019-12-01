class User {

    constructor(uid) {
        this.uid = uid;
        this.vote_weight = 1;
    }

    set_lobby(lobby_key) {
        this.lobby = lobby_key;
    }

    setUserObject(spotify_user_object) {
        this.spotify_user_object = spotify_user_object;
    }

    get_id() {
        return this.getUserObject().id;
    }

    getUserObject() {
        return this.spotify_user_object;
    }

    setAccessToken(access_token) {
        this.access_token = access_token;
    }

    getVote() {
        return this.vote_weight;
    }

    get_lobby() {
        return this.lobby;
    }

    get_access_token() {
        return this.access_token;
    }

    setPlaylists(playlists) {
        this.playlists = playlists;
    }

    getPlaylists() {
        return this.playlists;
    }

    get_uid() {
        return this.uid;
    }
}

module.exports.User = User;
