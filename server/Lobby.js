class Lobby {

    constructor(key, uid) {
        this.key = key;
        this.user_list = [];
        this.votes = {};
        this.addUser(uid);
    }

    set_settings(name, playlist_uri, chat, lyrics, volume) {
        this.name = name;
        this.playlist_uri = playlist_uri;
        this.chat = chat;
        this.lyrics = lyrics;
        this.volume = volume;
    }

    vote(song, user) {
        if (this.votes[song]) {
            this.votes.song = this.votes.song + user.getVote();
        } else {
            this.votes.song = user.getVote();
        }
    }

    addUser(uid) {
        this.user_list.push(uid);
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
}

module.exports.Lobby = Lobby;
