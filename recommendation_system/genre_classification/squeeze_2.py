import pandas as pd
import spotipy
import math
import re
from collections import Counter

def get_cosine(vec1, vec2):
    intersection = set(vec1.keys()) & set(vec2.keys())
    numerator = sum([vec1[x] * vec2[x] for x in intersection])

    sum1 = sum([vec1[x] ** 2 for x in list(vec1.keys())])
    sum2 = sum([vec2[x] ** 2 for x in list(vec2.keys())])
    denominator = math.sqrt(sum1) * math.sqrt(sum2)

    if not denominator:
        return 0.0
    else:
        return float(numerator) / denominator


def text_to_vector(text):
    WORD = re.compile(r"\w+")
    words = WORD.findall(text)
    return Counter(words)


spotify = spotipy.Spotify(auth="BQBviOOOWEH_epYbtgJezSLRa4tqrF-gpM9asfvLS_RPS5b9_s9yImXU_WApflhjRKH57aPylMZOZPznpoDGkKfRKfgEY6vlu6X8SvvWZT43_j--6qdE9WJPJU5sI9GfS5ZcZH7654F-gM_fah6AndBu7r0jiNYFrRz-obMjsTjqlu4vBMZ108tlmqUlB3EJe6TMCJU")

data = pd.read_csv("./concat_with_all_2.csv")
genres = data["genre"].unique()

rec_seeds = spotify.recommendation_genre_seeds()["genres"]

low_sim = []
squeeze_map = {}

for i in range(len(genres)):
    max_sim = 0
    max_genre = ""
    for j in range(len(rec_seeds)):

        g_vector = text_to_vector(genres[i])
        rec_vector = text_to_vector(rec_seeds[j])

        sim = get_cosine(g_vector, rec_vector)

        if max_sim < sim:
            max_sim = sim
            max_genre = rec_seeds[j]


    if (max_sim < 0.5):
        low_sim.append(genres[i])
    else:
        squeeze_map[genres[i]] = max_genre

    print("{} == {}, {}%".format(genres[i], max_genre, max_sim))

genres = data["genre"].map(squeeze_map)

data["genre"] = genres

data = data[data["genre"].notnull()]

# data.to_csv("squeezed_with_all_2.csv")

print(len(rec_seeds))
