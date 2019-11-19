class Lobby {

    constructor(key, uid) {
        this.key = key;
        this.user_list = [];
        this.addUser(uid);
    }

    set_settings(name, playlist_uri, chat, lyrics, volume) {
        this.name = name;
        this.playlist_uri = playlist_uri;
        this.chat = chat;
        this.lyrics = lyrics;
        this.volume = volume;
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
