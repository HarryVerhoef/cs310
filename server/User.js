class User {

    constructor(uid) {
        this.uid = uid;
        this.vote_weight = 1;
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

    getVote() {
        return this.vote_weight;
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

    get_uid() {
        return this.uid;
    }
}

module.exports.User = User;
