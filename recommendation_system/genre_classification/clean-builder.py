import spotipy
import csv
import pandas as pd
from string import ascii_lowercase
import requests
import json
import random



def refresh_auth():
    url = "https://u4lvqq9ii0.execute-api.us-west-2.amazonaws.com/epsilon-1/refresh"
    data = {
        "uid": "<ENTER UID>",
        "refresh_token": "<ENTER REFRESH TOKEN>"
    }
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }

    access_token = requests.post(url, data=data, headers=headers).json()["access_token"]

    print("refreshed access token:" + access_token)

    return spotipy.Spotify(auth=access_token)




def get_genre(playlist):
    artists_small = []
    genres = {}

    big_playlist = spotify.playlist(playlist["id"])
    name = big_playlist["name"]
    tracks = big_playlist["tracks"]["items"]
    mutable_tracks = tracks[:50]


    for track in mutable_tracks:

        artist_id = track["track"]["artists"][0]["id"]

        if artist_id is not None:
            artists_small.append(artist_id)


    artists_big = spotify.artists(artists_small)["artists"]


    for artist in artists_big:
        artist_genres = artist["genres"]
        for genre in artist_genres:
            genres[genre] = genres.get(genre,0) + 1

    if len(genres) != 0:
        return {"playlist_name": name, "genre": str(max(genres, key=genres.get))}



def write_to_csv(filename, cols, list):
    try:
        with open(filename, "w") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=cols)
            writer.writeheader()
            for data in list:
                writer.writerow(data)
    except IOError:
        print("I/O error")





def build_playlist_name_genre(start, end):

    playlist_name_genre = []

    # alphabet = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"]

    # words = pd.read_csv("./distinct_playlist_names.csv")["playlist_name"].tolist()



    for i in range(start, end):

        word = random.choice(english_words)

        print("Found playlists: " + str(len(playlist_name_genre)) + ", word: " + word)

        try:
            playlists = spotify.search(word, type="playlist", limit=50)["playlists"]["items"]

            for playlist in playlists:
                owner_id = playlist["owner"]["id"]

                if owner_id != my_id and owner_id != "spotify":
                    genre = get_genre(playlist)

                    if genre != None:
                        playlist_name_genre.append(genre)
        except:
            continue

    write_to_csv("./new_data/playlist_name_genres_3_" + str(start) + ".csv", ["playlist_name", "genre"], playlist_name_genre)


spotify = refresh_auth()

my_id = spotify.me()["id"]

f = open("./fresh_data/words.txt", "r")
x = f.readlines()
f.close()

english_words = [word.rstrip() for word in x]

print("Total number of words: " + str(len(english_words)))

# The number of words per csv
csv_length = 100

for i in range(0, 100000, csv_length):
    build_playlist_name_genre(i, i + csv_length)
    spotify = refresh_auth()
