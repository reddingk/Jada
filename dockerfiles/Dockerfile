#Download PI Linux
FROM balenalib/raspberrypi4-64-python:3.7

ARG OPENCV_VERSION=4.1.2

RUN cwd=$(pwd)
# Install dependencies needed for building and running OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    # to build and install
    unzip build-essential cmake pkg-config \
    checkinstall yasm \
    # to work with images
    libjpeg-dev libtiff-dev libjasper-dev libpng12-dev libtiff5-dev \
    # to work with videos
    libavcodec-dev libavformat-dev libswscale-dev \
    libxine2-dev libv4l-dev

RUN cd /usr/include/linux && \
    sudo ln -s -f ../libv4l1-videodev.h videodev.h && \
    cd $cwd

RUN apt-get install -y --no-install-recommends \
    libgstreamer0.10-dev libgstreamer-plugins-base0.10-dev \
    # needed by highgui tool
    libgtk2.0-dev \
    # for opencv math operations
    libatlas-base-dev gfortran \
    # others
    libtbb2 libtbb-dev qt5-default \
    libmp3lame-dev libtheora-dev \
    libvorbis-dev libxvidcore-dev libx264-dev \
    libopencore-amrnb-dev libopencore-amrwb-dev \
    libavresample-dev x264 v4l-utils \
    # NodeJS
    nodejs npm \
    # cleanup
    && rm -rf /var/lib/apt/lists/* \
    && apt-get -y autoremove

# Install python packages
RUN pip install --no-cache-dir \
    # OpenCV dependency
    numpy \
    # other usefull stuff
    ipython \
    # cleanup
    && find /usr/local \
       \( -type d -a -name test -o -name tests \) \
       -o \( -type f -a -name '*.pyc' -o -name '*.pyo' \) \
       -exec rm -rf '{}' + \
    && cd / \
    && rm -rf /usr/src/python ~/.cache

# Install OpenCV
RUN mkdir -p /opt && cd /opt && \
   wget https://github.com/opencv/opencv/archive/$OPENCV_VERSION.zip && \
   unzip $OPENCV_VERSION.zip && rm $OPENCV_VERSION.zip && \
   wget https://github.com/opencv/opencv_contrib/archive/$OPENCV_VERSION.zip && \
   unzip $OPENCV_VERSION.zip && rm $OPENCV_VERSION.zip && \
   cd /opt/opencv-$OPENCV_VERSION && mkdir -p build && cd build

# Build OpenCV
RUN cmake -D CMAKE_BUILD_TYPE=RELEASE \
  -D CMAKE_INSTALL_PREFIX=/usr/local \
  -D OPENCV_EXTRA_MODULES_PATH=/opt/opencv_contrib-$OPENCV_VERSION/modules \
  -D OPENCV_PYTHON2_INSTALL_PATH=/usr/local/lib/python2.7/site-packages/ \
  .. && \
  make -j4 && make install && ldconfig

# Test
RUN python -c "import cv2; print('Installed OpenCV version is: {} :)'.format(cv2.__version__))"

# Clean Up
RUN cd $cwd && rm -rf opencv

# Setup Jada Application
# Copy Application Code
COPY /dockerfiles/package.json /jada/package.json
COPY server.js /jada/server.js
COPY README.txt /jada/README.txt
COPY README_PHRASE.txt /jada/README_PHRASE.txt
COPY jadaEx.js /jada/jadaEx.js
COPY jadacmd.js /jada/jadacmd.js

# Copy Env File
COPY /dockerfiles/.env /jada/.env
COPY /dockerfiles/.env .env

# Copy Application Folders
COPY /api /jada/api
COPY /jada_3 /jada/jada_3
COPY /network /jada/network
COPY /public /jada/public 
COPY /security /jada/security

# Install Application Packages
RUN cd /jada; npm install

# Run Application
EXPOSE  1003
CMD ["node", "/jada/server.js"]

