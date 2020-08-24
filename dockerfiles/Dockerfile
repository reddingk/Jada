#Download Alphine Linux
FROM alpine:3.10

ARG OPENCV_VERSION=4.10

# Install OPENCV & Dependencies
# Add Edge repos
RUN echo -e "\n\
@edgemain http://nl.alpinelinux.org/alpine/edge/main\n\
@edgecomm http://nl.alpinelinux.org/alpine/edge/community\n\
@edgetest http://nl.alpinelinux.org/alpine/edge/testing"\
  >> /etc/apk/repositories


# Install required packages
RUN apk update && apk upgrade && apk --no-cache add \
  bash build-base clang-dev \
  clang cmake coreutils curl freetype-dev \
  ffmpeg-dev ffmpeg-libs gcc g++ git \
  gettext lcms2-dev libavc1394-dev libc-dev \
  libffi-dev libjpeg-turbo-dev libpng-dev \
  libressl-dev libwebp-dev linux-headers \
  libx11-dev make musl openblas openblas-dev \
  openjpeg-dev openssl python \
  python3 python3-dev tiff-dev \
  # Install NodeJs
  nodejs npm \
  unzip zlib-dev

RUN apk add --repository http://dl-cdn.alpinelinux.org/alpine/edge/testing \
            --update --no-cache libtbb libtbb-dev

  # Python 3 as default
RUN ln -s /usr/bin/python3 /usr/local/bin/python && \
  ln -s /usr/bin/pip3 /usr/local/bin/pip && \
  pip install --upgrade pip

# Install NumPy
RUN ln -s /usr/include/locale.h /usr/include/xlocale.h && \
  pip install numpy

# Install OpenCV
# https://github.com/opencv/opencv/archive/$OPENCV_VERSION.tar.gz
 RUN mkdir -p /opt && cd /opt && \
   wget https://github.com/opencv/opencv/archive/$OPENCV_VERSION.zip && \
   unzip $OPENCV_VERSION.zip && rm $OPENCV_VERSION.zip && \
   wget https://github.com/opencv/opencv_contrib/archive/$OPENCV_VERSION.zip && \
   unzip $OPENCV_VERSION.zip && rm $OPENCV_VERSION.zip \
   && \
   cd /opt/opencv-$OPENCV_VERSION && mkdir -p build && cd build && \
   cmake -D CMAKE_BUILD_TYPE=RELEASE \
     -D CMAKE_C_COMPILER=/usr/bin/clang \
     -D CMAKE_CXX_COMPILER=/usr/bin/clang++ \
     -D CMAKE_INSTALL_PREFIX=/usr/local \
     -D INSTALL_PYTHON_EXAMPLES=OFF \
     -D INSTALL_C_EXAMPLES=OFF \
     -D WITH_FFMPEG=ON \
     -D WITH_TBB=ON \
     -D OPENCV_EXTRA_MODULES_PATH=/opt/opencv_contrib-$OPENCV_VERSION/modules \
     -D OPENCV_ENABLE_NONFREE=ON \
     -D PYTHON_EXECUTABLE=/usr/local/bin/python \
     -D BUILD_EXAMPLES=OFF \
     -D BUILD_DOCS=OFF \
     -D BUILD_PERF_TESTS=OFF \
     -D INSTALL_C_EXAMPLES=OFF \
     -D INSTALL_PYTHON_EXAMPLES=OFF \
     -D BUILD_TESTS=OFF \
     .. \
   && \
   make -j4 && make install && cd .. && rm -rf build \
   && \
   cp -p $(find /usr/local/lib/python3.7/site-packages -name cv2.*.so) \
    /usr/lib/python3.7/site-packages/cv2.so && \
    python -c 'import cv2; print("Python: import cv2 - SUCCESS")'

# Clean Up
RUN apk del curl wget unzip


# Setup Jada Application

# Get Jada Code
RUN git clone https://github.com/reddingk/Jada.git

# Copy Build Files
RUN rm /Jada/package.json && \
    rm /Jada/package-lock.json && \
    rm -r /Jada/jada_3/config/data/photoMemory

COPY /dockerfiles/package.json /Jada/package.json
COPY /public /Jada/public 

COPY /jada_3/config/data/imgModels /Jada/jada_3/config/data/imgModels
COPY /jada_3/config/data/photoMemory /Jada/jada_3/config/data/photoMemory
COPY /jada_3/fileCache /Jada/jada_3/fileCache

# Copy Env File
COPY /dockerfiles/.env /Jada/.env
COPY /dockerfiles/.env .env

# Remove Development Files
RUN rm -r /Jada/dockerfiles && \
    rm /Jada/Dockerfile && \
    rm /Jada/jadacmd.js && \
    rm /Jada/jadaEx.js

# Install Application Packages
RUN cd /jada; npm install

# Run Application
 EXPOSE  1003
 #CMD ["node", "/jada/server.js"]