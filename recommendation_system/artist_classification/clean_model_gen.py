import tensorflow as tf
import pandas as pd
import numpy as np
import keras
from sklearn.model_selection import train_test_split
import math
import random
import matplotlib.pyplot as plt
test_accuracies = []

def enumerate():
    data = pd.read_csv("./data.csv")
    num_artists = len(data["artist"].unique())
    data["artist"] = pd.Categorical(pd.factorize(data["artist"])[0] + 1)

    print(data["artist"])

    data.to_csv("factorised_data.csv", index=False)

class TestCallback(tf.keras.callbacks.Callback):
	def __init__(self, test_data):
		self.test_data = test_data

	def on_epoch_end(self, epoch):
		x, y = self.test_data
		test_accuracy = self.model.evaluate(x, y)
		test_accuracies.append(test_accuracy[1])


def generator(stage, factor, batch_size):

    n_a, X_t_a, X_t_f, X_v_a, X_v_f, y_t_a, y_v_a = preprocess(factor)

    if stage == "train":
        while True:
            for b in range(0, len(X_t_a), batch_size):
                X_t_a_batch = X_t_a[b:b+batch_size]
                X_t_f_batch = X_t_f[b:b+batch_size]
                y_t_a_batch = y_t_a[b:b+batch_size]

                yield([X_t_a_batch, X_t_f_batch], y_t_a_batch)

    elif stage == "test":
        while True:
            for b in range(0, len(X_t_a), batch_size):
                X_v_a_batch = X_v_a[b:b+batch_size]
                X_v_f_batch = X_v_f[b:b+batch_size]
                y_v_a_batch = y_v_a[b:b+batch_size]

                yield([X_v_a_batch, X_v_f_batch], y_v_a_batch)


def preprocess(factor=1):

    data = pd.read_csv("sliced_data_{}.csv".format(factor))
    num_artists = len(data["artist"].unique())

    print("Num artists: {}".format(num_artists))

    # Format into sets of 6
    X = []
    y = []

    for playlist_num in data["playlist_number"].unique():
        cond = data["playlist_number"] == playlist_num
        subframe = data[cond]

        for i in range(0, len(subframe), 4):
            if (i + 4 < len(subframe)):
                # print(np.delete(subframe.loc[:, "artist":"valence"].values.tolist(), 0, 1))
                # print(subframe.loc[:, "artist":"valence"].iloc[i:i+5])
                X.append(subframe.loc[:, "artist":"valence"].iloc[i:i+3].values.tolist())
                y.append(subframe.iloc[i+4].tolist()[1:])

    X_np = np.asarray(X)
    y_np = np.asarray(y)


    print("X shape: {}".format(X_np.shape))
    # print(X_np[0])
    print("y shape: {}".format(y_np.shape))

    X_train, X_test, y_train, y_test = train_test_split(X_np, y_np, test_size=0.2, random_state=42)


    X_t_a = X_train[:, :, 0]
    X_t_f = X_train[:, :, 1:]

    X_v_a = X_test[:, :, 0]
    X_v_f = X_test[:, :, 1:]


    y_t_a = y_train[:, 0]
    y_v_a = y_test[:, 0]

    return num_artists, X_t_a, X_t_f, X_v_a, X_v_f, y_t_a, y_v_a



def build(num_artists, embedding_dim, rnn_dim, dropout):
    tf.random.set_seed(42)


    # Define Inputs
    artist_in = tf.keras.layers.Input(shape=(3,))
    track_features_in = tf.keras.layers.Input(shape=(3,8))

    # Embeddings
    artist_embedding = tf.keras.layers.Embedding(num_artists+1, embedding_dim)(artist_in)

    # Merge with concat
    combined = tf.keras.layers.concatenate([artist_embedding, track_features_in])

    # Layer Definitions
    rl = tf.keras.layers.SimpleRNN(rnn_dim, activation="relu")(combined)
    dropout = tf.keras.layers.Dropout(dropout)(rl)
    output = tf.keras.layers.Dense(num_artists, activation="softmax")(dropout)

    model = tf.keras.models.Model(inputs=[artist_in, track_features_in], outputs=output)

    model.compile(loss="sparse_categorical_crossentropy", optimizer="adam", metrics=["accuracy"])

    model.summary()

    return model


def train_model(model, factor):
    batch_size = 64

    history = model.fit(generator("train", factor, batch_size), epochs=1, steps_per_epoch=math.floor((204756 * factor)/batch_size))

    test_accuracy = model.evaluate([X_v_a, X_v_f], y_v_a)

    return test_accuracy[1], history

def tune(num_artists, factor):
    accuracy_dict = {}

    for i in range(0, 2):
        embedding_dim = random.randint(1000, 2000)
        rnn_dim = random.randint(100, 300)
        dropout = random.randint(0, 40) * 0.01
        model = build(num_artists, embedding_dim, rnn_dim, dropout)
        test_accuracy = train_model(model, factor)

        print("Model {}: {}".format(i, test_accuracy))

        accuracy_dict[test_accuracy[0]] = [embedding_dim, rnn_dim, dropout]

    return accuracy_dict


def plotandsave(d):
    test_accuracies_raw = [*d]

    embedding_dim = [d[accuracy][0] for accuracy in test_accuracies_raw]
    rnn_dim = [d[accuracy][1] for accuracy in test_accuracies_raw]
    dropout = [d[accuracy][2] for accuracy in test_accuracies_raw]

    # Embedding Output Dimensionality
    fig = plt.figure()
    ax = fig.add_subplot(111)
    ax.set_xlabel("Embedding Dimensionality")
    ax.set_ylabel("Validation Accuracy")
    ax.scatter(embedding_dim, test_accuracies_raw)
    fig.savefig(fname="embedding_dim_artist.png")


    # RNN Output Dimensionality
    fig = plt.figure()
    ax = fig.add_subplot(111)
    ax.set_xlabel("RNN Output Dimensionality")
    ax.set_ylabel("Validation Accuracy")
    ax.scatter(rnn_dim, test_accuracies_raw)
    fig.savefig(fname="rnn_dim_artist.png")


    # Dropout Dimensionality
    fig = plt.figure()
    ax = fig.add_subplot(111)
    ax.set_xlabel("Dropout")
    ax.set_ylabel("Validation Accuracy")
    ax.scatter(dropout, test_accuracies_raw)
    fig.savefig(fname="dropout_artist.png")


# print("X_t_a: {}".format(X_t_a.shape))
# print("X_t_f: {}".format(X_t_f.shape))
# print("X_v_a: {}".format(X_v_a.shape))
# print("X_v_f: {}".format(X_v_f.shape))
#
# print("y_t_a: {}".format(y_t_a.shape))
# print("y_v_a: {}".format(y_v_a.shape))

accuracies = tune(84469, 1)

print(accuracies)

plotandsave(accuracies)
