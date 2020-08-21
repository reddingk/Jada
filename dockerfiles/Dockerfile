# Download opencv nodejs Ubuntu
FROM resin/raspberrypi3-python:3.4

RUN cwd=$(pwd)

# Install dependencies needed for building and running OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    # to build and install
    unzip \
    build-essential cmake pkg-config \
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
    libavresample-dev \
    x264 v4l-utils \
    nodejs npm \
    # cleanup
    && rm -rf /var/lib/apt/lists/* \
    && apt-get -y autoremove

RUN pip install --upgrade pip

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
COPY download_build_install_opencv.sh download_build_install_opencv.sh
RUN ./download_build_install_opencv.sh

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
 #CMD ["node", "/jada/server.js"]