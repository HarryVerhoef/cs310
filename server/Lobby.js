class Lobby {

    constructor(key, uid) {
        this.key = key;
        this.user_list = [];
        this.votes = {};
        this.add_user(uid);
        this.track = null;
        this.recommendations = [];
    }

    set_settings(name, playlist_uri, chat, lyrics, volume) {
        this.name = name;
        this.playlist_uri = playlist_uri;
        this.chat = chat;
        this.lyrics = lyrics;
        this.volume = volume;
    }

    set_track(track) {
        this.track = track;
    }

    get_track_name() {
        if (this.track) {
            return this.track.name;
        } else {
            return "";
        }
    }

    get_track_id() {
        if (this.track) {
            return this.track.id;
        } else {
            return "";
        }
    }

    get_track_image_url() {
        if (this.track) {
            return this.track.images[0];
        } else {
            return "";
        }
    }

    vote(song, user) {
        if (this.votes[song]) {
            this.votes[song] = this.votes.song + user.getVote();
        } else {
            this.votes[song] = user.getVote();
        }
    }

    getNextSong() {
        var max = 0;
        var maxSong = "";
        for (var song in this.votes) {
            // skip loop if the property is from prototype
            if (!this.votes.hasOwnProperty(song)) continue;

            var songVotes = this.votes[song];

            if (songVotes > max) {
                max = songVotes;
                maxSong = song;
            }
        }
        return maxSong;
    }

    get_recommendations() {
        return this.recommendations;
    }

    add_user(uid) {
        this.user_list.push(uid);
    }

    get_users() {
        return this.user_list;
    }

    getName() {
        return this.name;
    }

    getKey() {
        return this.key;
    }

    isChatEnabled() {
        return this.chat;
    }

    isLyricsEnabled() {
        return this.lyrics;
    }

    isVolumeEnabled() {
        return this.volume;
    }

    set_playlist(playlist) {
        this.playlist_uri = playlist;
    }

    get_playlist(playlist) {
        return this.playlsit_uri;
    }

    get_track() {
        return this.track
    }

    set_recommendations(recommendations) {
        this.recommendations = recommendations;
    }
}

module.exports.Lobby = Lobby;
