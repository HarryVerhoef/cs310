import tensorflow as tf
import pandas as pd
import numpy as np
import keras
from keras.preprocessing.text import Tokenizer
from keras.preprocessing.sequence import pad_sequences
from sklearn.model_selection import train_test_split
from keras import Sequential
from keras.layers import Embedding, Conv1D, GlobalAveragePooling1D, Dropout, Dense
import json
import io
import random
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker

data = pd.read_csv("./squeezed_with_all_2.csv")

X = data["playlist_name"]
y = data["genre"]

corpus = X.values.tolist()

unique_genres = y.unique()

test_accuracies = []

class TestCallback(tf.keras.callbacks.Callback):
	def __init__(self, test_data):
		self.test_data = test_data

	def on_epoch_end(self, epoch, logs={}):
		x, y = self.test_data
		test_accuracy = self.model.evaluate(x, y)
		test_accuracies.append(test_accuracy[1])
		print("Testing accuracy: " + str(test_accuracy[1]))

def y_to_categorical(y):
    int_encode_map = {}
    int_decode_map = [0] * len(unique_genres)
    for i in range(len(unique_genres)):
        int_encode_map[unique_genres[i]] = i
        int_decode_map[i] = unique_genres[i]
    y = y.map(int_encode_map)
    return tf.keras.utils.to_categorical(y)

def tokenise(X, X_train, X_test, max_length=20):
    t = Tokenizer(char_level=False)
    t.fit_on_texts(X.values.tolist())

    tokenised_X_train = t.texts_to_sequences(X_train)
    tokenised_X_test = t.texts_to_sequences(X_test)
    padded_X_train = pad_sequences(tokenised_X_train, maxlen=max_length, padding="post")
    padded_X_test = pad_sequences(tokenised_X_test, maxlen=max_length, padding="post")

    return padded_X_train, padded_X_test, len(t.word_index) + 1

def split(X, y, frac=1):
    X_train, X_test, y_train, y_test = train_test_split(X, y_to_categorical(y), test_size=0.2, random_state=42)


    X = X[0: int(frac * len(X))]
    X_train = X_train[0: int(frac * len(X_train))]
    X_test = X_test[0: int(frac * len(X_test))]
    y_train = y_train[0: int(frac * len(y_train))]
    y_test = y_test[0: int(frac * len(y_test))]

    tok_X_train, tok_X_test, vocab_size = tokenise(X, X_train, X_test)

    return tok_X_train, tok_X_test, y_train, y_test, vocab_size

def define_model(vocab_size, y_dim, filters, kernel_size, dropout, embed_dim):
    tf.random.set_seed(42)

    print("filters: {}".format(filters))
    print("kernel_size: {}".format(kernel_size))

    model = Sequential([
        Embedding(vocab_size, embed_dim, input_length=20, trainable=True),
        Conv1D(filters, kernel_size, activation="relu"),
        GlobalAveragePooling1D(),
        Dropout(dropout),
        Dense(y_dim, activation="softmax")
    ])

    model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])
    return model

def train_model(model, X_train, X_test, y_train, y_test, epochs):

    history = model.fit(X_train, y_train, epochs=epochs, validation_data=(X_test, y_test), callbacks=[TestCallback((X_test, y_test))])

    test_accuracy = model.evaluate(X_test, y_test)

    return (test_accuracy[1], history)


def tune(vocab_size, y_dim, X_train, X_test, y_train, y_test):
    accuracy_dict = {}
    for i in range(0, 20):
        epochs = 1
        filters = random.randint(150, 350)
        kernel_size = 10
        dropout = 0.2
        embed_dim = 100
        model = define_model(vocab_size, y_dim, filters, kernel_size, dropout, embed_dim)
        test_accuracy = train_model(model, X_train, X_test, y_train, y_test, epochs)

        print("Model {}: {}".format(i, test_accuracy))

        accuracy_dict[test_accuracy[0]] = [epochs, filters, kernel_size, dropout, embed_dim]

    return accuracy_dict



def plot_tuned(accuracies):
    test_accuracies = list(accuracies.keys())

    epochs = [accuracies[accuracy][0] for accuracy in test_accuracies]
    filters = [accuracies[accuracy][1] for accuracy in test_accuracies]
    kernel_size = [accuracies[accuracy][2] for accuracy in test_accuracies]
    dropout = [accuracies[accuracy][3] for accuracy in test_accuracies]
    embed_dim = [accuracies[accuracy][4] for accuracy in test_accuracies]


    # Epochs
    fig = plt.figure()
    ax = fig.add_subplot(111)
    ax.set_xlabel("Epochs")
    ax.set_ylabel("Validation Accuracy")
    ax.scatter(epochs, test_accuracies)
    fig.savefig(fname="epochs.png")

    # Filters
    fig = plt.figure()
    ax = fig.add_subplot(111)
    ax.set_xlabel("Filters")
    ax.set_ylabel("Validation Accuracy")
    ax.scatter(filters, test_accuracies)
    fig.savefig(fname="filters.png")

    # Kernel Size
    fig = plt.figure()
    ax = fig.add_subplot(111)
    ax.set_xlabel("Kernel Size")
    ax.set_ylabel("Validation Accuracy")
    ax.scatter(kernel_size, test_accuracies)
    fig.savefig(fname="kernel_size.png")

    # Dropout
    fig = plt.figure()
    ax = fig.add_subplot(111)
    ax.set_xlabel("Dropout")
    ax.set_ylabel("Validation Accuracy")
    ax.scatter(dropout, test_accuracies)
    fig.savefig(fname="droput.png")

    # Embedding Dimensionality
    fig = plt.figure()
    ax = fig.add_subplot(111)
    ax.set_xlabel("Embedding Dimensionality")
    ax.set_ylabel("Validation Accuracy")
    ax.scatter(embed_dim, test_accuracies)
    fig.savefig(fname="embed_dim.png")


X_train, X_test, y_train, y_test, vocab_size = split(X, y)

print("VOCAB SIZE: " + str(vocab_size))

# dict = {0.3794953525066376: [5, 170, 43, 0.19, 56], 0.37530389428138733: [5, 292, 5, 0.13, 100], 0.3828485310077667: [4, 319, 18, 0.15, 125], 0.3851957321166992: [5, 219, 23, 0.16, 83], 0.36633414030075073: [2, 234, 29, 0.09, 121], 0.370190292596817: [2, 157, 26, 0.19, 79], 0.3739626109600067: [2, 305, 36, 0.2, 75], 0.3434487283229828: [1, 171, 18, 0.36, 86], 0.3776510953903198: [4, 209, 23, 0.33, 78], 0.3825131952762604: [4, 341, 33, 0.25, 129], 0.3807528018951416: [4, 346, 10, 0.14, 67], 0.3793276846408844: [3, 310, 25, 0.27, 104], 0.3768966495990753: [5, 314, 26, 0.12, 87], 0.38268086314201355: [5, 317, 43, 0.15, 101], 0.3779025971889496: [4, 159, 17, 0.16, 88], 0.3456282913684845: [1, 220, 29, 0.27, 88], 0.34613126516342163: [1, 229, 28, 0.4, 93], 0.3821778893470764: [3, 326, 5, 0.26, 87], 0.3836868107318878: [4, 173, 20, 0.26, 88], 0.3433648943901062: [1, 341, 9, 0.21, 91], 0.38117194175720215: [3, 191, 50, 0.14, 146], 0.3815910816192627: [5, 176, 31, 0.31, 106], 0.3726213574409485: [2, 331, 11, 0.11, 53], 0.34462234377861023: [1, 252, 35, 0.2, 145], 0.34085002541542053: [1, 265, 24, 0.11, 81], 0.3693520128726959: [2, 170, 14, 0.06, 145], 0.37957918643951416: [5, 278, 28, 0.05, 138]}

#dict = {0.36874818801879883: [3, 290, 6, 0.4, 118], 0.3700491487979889: [3, 164, 18, 0.39, 69], 0.3647007942199707: [3, 334, 4, 0.01, 118], 0.3622434139251709: [3, 209, 1, 0.32, 143], 0.3683145344257355: [3, 342, 13, 0.18, 51], 0.3788667321205139: [3, 214, 15, 0.37, 105], 0.36990460753440857: [3, 290, 3, 0.07, 147], 0.36036425828933716: [3, 234, 1, 0.0, 75], 0.36961549520492554: [3, 233, 14, 0.16, 64], 0.37597572803497314: [3, 166, 19, 0.38, 97], 0.3597860634326935: [3, 160, 9, 0.27, 85], 0.37135010957717896: [3, 349, 13, 0.12, 59], 0.37294015288352966: [3, 349, 13, 0.09, 65], 0.35096848011016846: [3, 184, 2, 0.06, 76], 0.3740965723991394: [3, 285, 12, 0.21, 117], 0.37265104055404663: [3, 242, 11, 0.17, 129], 0.36976003646850586: [3, 311, 14, 0.21, 131], 0.3707718849182129: [3, 252, 10, 0.06, 100], 0.3716391921043396: [3, 218, 18, 0.0, 96], 0.37308469414711: [3, 340, 18, 0.37, 114], 0.36513441801071167: [3, 236, 10, 0.13, 81], 0.3554495573043823: [3, 288, 4, 0.15, 56], 0.3670135736465454: [3, 304, 2, 0.09, 92], 0.3631107211112976: [3, 282, 1, 0.4, 110], 0.3577623665332794: [3, 161, 5, 0.16, 91], 0.37380746006965637: [3, 237, 18, 0.14, 88], 0.3677363395690918: [3, 246, 18, 0.11, 74], 0.35573863983154297: [3, 206, 2, 0.25, 70], 0.37669846415519714: [3, 206, 15, 0.17, 86], 0.37221741676330566: [3, 275, 1, 0.27, 122], 0.3810349702835083: [3, 295, 17, 0.24, 130], 0.37048280239105225: [3, 252, 13, 0.21, 79], 0.36672449111938477: [3, 251, 1, 0.23, 148], 0.35631686449050903: [3, 234, 10, 0.27, 52], 0.37062734365463257: [3, 315, 8, 0.17, 130], 0.3684591054916382: [3, 311, 4, 0.29, 126], 0.3703382611274719: [3, 313, 6, 0.39, 119], 0.3742411136627197: [3, 284, 17, 0.13, 88], 0.35805144906044006: [3, 226, 3, 0.2, 91], 0.3710609972476959: [3, 251, 1, 0.11, 137], 0.3717837631702423: [3, 305, 12, 0.0, 57], 0.34764382243156433: [3, 157, 6, 0.4, 71], 0.37930038571357727: [3, 342, 16, 0.14, 86], 0.36802545189857483: [3, 203, 14, 0.07, 123], 0.3620988726615906: [3, 305, 3, 0.19, 118], 0.3765539228916168: [3, 277, 10, 0.32, 106], 0.36657994985580444: [3, 165, 4, 0.04, 113], 0.37438565492630005: [3, 331, 10, 0.06, 131], 0.36585718393325806: [3, 318, 3, 0.02, 141], 0.3764093816280365: [3, 192, 19, 0.27, 142], 0.3671581447124481: [3, 171, 4, 0.2, 142], 0.3778548836708069: [3, 310, 17, 0.29, 136]}


# [3, 295, 17, 0.24, 130]
# max_key = max([*dict])
# min_key = min([*dict])
#
# max_params = str(dict[max_key])
# min_params = str(dict[min_key])
#
# print("max model: {}, params: {}".format(max_key, max_params))
# print("min model: {}, params: {}".format(min_key, min_params))

# accuracies = tune(vocab_size, len(unique_genres), X_train, X_test, y_train, y_test)

# print(accuracies)

# 0.49325278401374817, 0.527155876159668, 0.5327078700065613



# plot_tuned(accuracies)

# model = define_model(vocab_size, len(unique_genres), 295, 17, 0.24, 130)

# test_accuracy, history = train_model(model, X_train, X_test, y_train, y_test, 3)

print(test_accuracy)

print(history.history["accuracy"])

fig = plt.figure()
ax = fig.add_subplot(111)
ax.set_xlabel("Epoch")
ax.set_ylabel("Validation Accuracy")
# ax.plot(history.history["accuracy"], label="Training Accuracy")
ax.plot(test_accuracies, label="Validation Accuracy")
ax.legend()
plt.xticks(np.arange(len(history.history["accuracy"])), np.arange(1, len(history.history["accuracy"])+1))
fig.savefig(fname="trainvstest_2.png")
