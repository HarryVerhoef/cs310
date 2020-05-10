import pandas as pd
import numpy as np
import math
import matplotlib.pyplot as plt
from  matplotlib.ticker import FuncFormatter

factor = 1



data = pd.read_csv("factorised_data.csv")

print(data)

def slice(factor):

    index = math.floor(factor * data["playlist_number"][len(data) - 1])

    print(index)

    sliced_data = data[data["playlist_number"] <= index]

    return sliced_data



def drawgraph():

    num_artists = []

    for i in range(5, 105, 5):
        new_data = slice(i * 0.01)
        num_artists.append(len(new_data["artist"].unique()))

    formatter = FuncFormatter(lambda x_val, tick_pos: "{}".format(((x_val*5)+5)))

    fig = plt.figure()
    ax = fig.add_subplot(111)
    ax.set_xlabel("Percentage of whole dataset")
    ax.set_ylabel("Number of unique artists")
    ax.xaxis.set_major_formatter(formatter)
    ax.plot(num_artists)
    fig.savefig(fname="num_artists.png")




drawgraph()
# data = slice(factor)
# data.to_csv("sliced_data_{}.csv".format(factor), index=False)
