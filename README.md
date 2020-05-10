# A mobile application for democratic music playback
### Recommender
 - Install Python 3 and the relevant packages, namely Spotipy, Tensorflow, Pandas, Numpy, Sklearn.
 - Generate a Spotify refresh token and place this in the constructor of the Spotipy object as the named parameter ```auth```, for example:
```python
import Spotipy

spotify = Spotipy(auth=<token>)
```
 - Run ```python3 clean-builder.py``` in the terminal to begin the data-scraping process.
 - Depending on the type of dataset you wish to build, certain code as part of ```clean-builder.py``` may need to be changed or commented out.
 - With the newly compiled datasets, the both the artist and genre classification models can be trained and tested.
 - Note: Certain pre-processing procedure may be necessary, such as the cosine similarity clustering mechanism as part of ```squeeze_2.py```.

### Application
- First, react native must be installed and set up on the machine that the application is to be built from.
- In order to build the project application to a device, the ```juke.xcworkspace``` file must be loaded into XCode. From there, the project can be built to any iOS device.\
- The backend should work for any user since it is externally hosted. But if the reader wishes to mimic the backend, the only feasible option is to compress each of the lambda-deployment-packages children folders using the zip script, and then upload each to an individual lambda function, then build the architecture that is described in the report.
