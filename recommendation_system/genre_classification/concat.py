import pandas as pd

prefix = "./new_data/playlist_name_genre_"
suffix = ".csv"

concat_df = pd.DataFrame()

for i in range(0, 4000, 100):
    next_df = pd.read_csv(prefix + str(i) + suffix)
    concat_df = concat_df.append(next_df, ignore_index=True)

for i in range(0, 1400, 100):
    next_df = pd.read_csv(prefix + "2_" + str(i) + suffix)
    concat_df = concat_df.append(next_df, ignore_index=True)

for i in range(0, 2300, 100):
    next_df = pd.read_csv(prefix + "3_" + str(i) + suffix)
    concat_df = concat_df.append(next_df, ignore_index=True)

for i in range(0, 1600, 100):
    next_df = pd.read_csv(prefix + "4_" + str(i) + suffix)
    concat_df = concat_df.append(next_df, ignore_index=True)

for i in range(0, 2100, 100):
    next_df = pd.read_csv(prefix + "5_" + str(i) + suffix)
    concat_df = concat_df.append(next_df, ignore_index=True)

for i in range(0, 7100, 100):
    next_df = pd.read_csv(prefix + "6_" + str(i) + suffix)
    concat_df = concat_df.append(next_df, ignore_index=True)

for i in range(0, 9900, 100):
    next_df = pd.read_csv(prefix + "7_" + str(i) + suffix)
    concat_df = concat_df.append(next_df, ignore_index=True)

more_words_prefix = "./new_data/playlist_name_genres_"

for i in range(0, 10600, 100):
    next_df = pd.read_csv(more_words_prefix + "2_" + str(i) + suffix)
    concat_df = concat_df.append(next_df, ignore_index=True)

for i in range(0, 8500, 100):
    next_df = pd.read_csv(more_words_prefix + "3_" + str(i) + suffix)
    concat_df = concat_df.append(next_df, ignore_index=True)

subwords_prefix = "./new_data/playlist_name_genre_subwords_"

for i in range(0, 2600, 100):
    next_df = pd.read_csv(subwords_prefix + "1_" + str(i) + suffix)
    concat_df = concat_df.append(next_df, ignore_index=True)

for i in range(0, 500, 100):
    next_df = pd.read_csv(subwords_prefix + "2_" + str(i) + suffix)
    concat_df = concat_df.append(next_df, ignore_index=True)

for i in range(0, 3600, 100):
    next_df = pd.read_csv(subwords_prefix + "3_" + str(i) + suffix)
    concat_df = concat_df.append(next_df, ignore_index=True)

pnames_prefix = "./new_data/playlist_name_pnames_"

for i in range(0, 3300, 100):
    next_df = pd.read_csv(pnames_prefix + str(i) + suffix)
    concat_df = concat_df.append(next_df, ignore_index=True)

for i in range(0, 2500, 100):
    next_df = pd.read_csv(pnames_prefix + "2_" + str(i) + suffix)
    concat_df = concat_df.append(next_df, ignore_index=True)

print(concat_df)

concat_df.to_csv("concat_with_all_2.csv", index=False)
