#Download Alphine Linux
FROM alpine:3.10

ARG OPENCV_VERSION=4.1.2

# Install OPENCV & Dependencies
# Add Edge repos
RUN echo -e "\n\
@edgemain http://nl.alpinelinux.org/alpine/edge/main\n\
@edgecomm http://nl.alpinelinux.org/alpine/edge/community\n\
@edgetest http://nl.alpinelinux.org/alpine/edge/testing"\
  >> /etc/apk/repositories

# Update Node
RUN apk add --update nodejs
RUN apk add --update npm

# Install required packages
RUN apk update && apk upgrade && apk --no-cache add \
  bash build-base ca-certificates clang-dev \
  clang cmake coreutils curl freetype-dev \
  ffmpeg-dev ffmpeg-libs gcc-arm* g++ git \
  gettext lcms2-dev libavc1394-dev libc-dev \
  libffi-dev libjpeg-turbo-dev libpng-dev \
  libressl-dev libwebp-dev linux-headers \
  libx11-dev make musl openblas openblas-dev \
  openjpeg-dev openssl python protobuf-compiler \
  python3 python3-dev tiff-dev \
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
     -D CMAKE_INSTALL_PREFIX=/usr/local \
     -D OPENCV_EXTRA_MODULES_PATH=/opt/opencv_contrib-$OPENCV_VERSION/modules \
     -D ENABLE_NEON=ON \
     -D ENABLE_VFPV3=ON \
     -D WITH_OPENMP=ON \
     -D BUILD_TIFF=ON \
     -D WITH_FFMPEG=ON \
     -D WITH_GSTREAMER=ON \
     -D WITH_TBB=ON \
     -D BUILD_TBB=ON \
     -D BUILD_TESTS=OFF \
     -D WITH_EIGEN=OFF \
     -D WITH_V4L=ON \
     -D WITH_LIBV4L=ON \
     -D WITH_VTK=OFF \
     -D OPENCV_EXTRA_EXE_LINKER_FLAGS=-latomic \
     -D OPENCV_ENABLE_NONFREE=ON \
     -D INSTALL_C_EXAMPLES=OFF \
     -D INSTALL_PYTHON_EXAMPLES=OFF \
     -D BUILD_NEW_PYTHON_SUPPORT=ON \
     -D BUILD_opencv_python3=TRUE \
     -D OPENCV_GENERATE_PKGCONFIG=ON \
     -D BUILD_EXAMPLES=OFF \
     .. \
   && \
   make && make install && cd .. && rm -rf build \
   && \
   cp -p $(find /usr/local/lib/python3.7/site-packages -name cv2.*.so) \
    /usr/lib/python3.7/site-packages/cv2.so && \
    python -c 'import cv2; print("Python: import cv2 - SUCCESS")'


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

# Generate SSL Cert
#RUN cd /jada; openssl req -nodes -new -x509 -keyout server.key -out server.cert -days 1024 -subj "/C=US/ST=NA/L=NA/O=Roj/CN=jada"

# Copy server files
#RUN cp /jada/server.key /;cp /jada/server.cert /

# Run Application
 EXPOSE  1003
 CMD ["node", "/jada/server.js"]