#Download Alphine Linux
FROM alpine:3.8

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
  bash \
  build-base \
  ca-certificates \
  clang-dev \
  clang \
  cmake \
  coreutils \
  curl \ 
  freetype-dev \
  ffmpeg-dev \
  ffmpeg-libs \
  gcc \
  g++ \
  git \
  gettext \
  lcms2-dev \
  libavc1394-dev \
  libc-dev \
  libffi-dev \
  libjpeg-turbo-dev \
  libpng-dev \
  libressl-dev \
  libtbb@edgetest \
  libtbb-dev@edgetest \
  libwebp-dev \
  linux-headers \
  make \
  musl \
  openblas@edgecomm \
  openblas-dev@edgecomm \
  openjpeg-dev \
  openssl \
  python \
  python3 \
  python3-dev \
  tiff-dev \
  unzip \
  zlib-dev


  # Python 3 as default
RUN ln -s /usr/bin/python3 /usr/local/bin/python && \
  ln -s /usr/bin/pip3 /usr/local/bin/pip && \
  pip install --upgrade pip

# Install NumPy
RUN ln -s /usr/include/locale.h /usr/include/xlocale.h && \
  pip install numpy

#RUN apk add g++ make python

# Install OpenCV
# https://github.com/opencv/opencv/archive/4.0.1.tar.gz
 RUN mkdir /opt && cd /opt && \
   wget https://github.com/opencv/opencv/archive/4.0.1.zip && \
   unzip 4.0.1.zip && rm 4.0.1.zip && \
   wget https://github.com/opencv/opencv_contrib/archive/4.0.1.zip && \
   unzip 4.0.1.zip && rm 4.0.1.zip \
   && \
   cd /opt/opencv-4.0.1 && mkdir build && cd build && \
   cmake -D CMAKE_BUILD_TYPE=RELEASE \
     -D CMAKE_C_COMPILER=/usr/bin/clang \
     -D CMAKE_CXX_COMPILER=/usr/bin/clang++ \
     -D CMAKE_INSTALL_PREFIX=/usr/local \
     -D INSTALL_PYTHON_EXAMPLES=OFF \
     -D INSTALL_C_EXAMPLES=OFF \
     -D WITH_FFMPEG=ON \
     -D WITH_TBB=ON \
     -D OPENCV_EXTRA_MODULES_PATH=/opt/opencv_contrib-4.0.1/modules \
     -D PYTHON_EXECUTABLE=/usr/local/bin/python \
     .. \
   && \
   make -j$(nproc) && make install && cd .. && rm -rf build \
   && \
   cp -p $(find /usr/local/lib/python3.6/site-packages -name cv2.*.so) \
    /usr/lib/python3.6/site-packages/cv2.so && \
    python -c 'import cv2; print("Python: import cv2 - SUCCESS")'


# Setup Jada Application
# Copy Application Code
 COPY /dockerfiles/package.json /jada/package.json
 COPY server.js /jada/server.js
 COPY README.txt /jada/README.txt
 COPY README_PHRASE.txt /jada/README_PHRASE.txt
 COPY jadaEx.js /jada/jadaEx.js
 COPY jadacmd.js /jada/jadacmd.js
 COPY .env /jada/.env

# Copy Application Folders
 COPY /jada_3 /jada/jada_3
 COPY /network /jada/network
 COPY /api /jada/api
 COPY /security /jada/security

# Install Application Packages
 RUN cd /jada; npm install

# Run Application
# EXPOSE  1003
# CMD ["node", "/jada/server.js"]