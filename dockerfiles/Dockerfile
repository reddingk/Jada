#Download Linux
FROM ubuntu:20.04

RUN apt-get update && apt-get upgrade

RUN apt-get install --yes build-essential cmake unzip pkg-config

RUN apt-get install --yes libjpeg-dev libpng-dev
RUN apt-get install --yes libavcodec-dev libavformat-dev libswscale-dev
RUN apt-get install --yes libgtk2.0-dev libcanberra-gtk* libgtk-3-dev
RUN apt-get install --yes libxvidcore-dev libx264-dev
RUN apt-get install --yes python3-dev python3-numpy python3-pip
RUN apt-get install --yes libtbb2 libtbb-dev libdc1394-22-dev \
                          libv4l-dev v4l-utils \
                          libopenblas-dev libatlas-base-dev libblas-dev \
                          liblapack-dev gfortran libhdf5-dev \
                          libprotobuf-dev libgoogle-glog-dev libgflags-dev \
                          protobuf-compiler 

# Download opencv
RUN cd ~ \
  && wget -O opencv.zip https://github.com/opencv/opencv/archive/4.3.0.zip \
  && wget -O opencv_contrib.zip https://github.com/opencv/opencv_contrib/archive/4.3.0.zip

RUN unzip opencv.zip && unzip opencv_contrib.zip
RUN mv opencv-4.3.0 opencv && mv opencv_contrib-4.3.0 opencv_contrib

# Clean Up
RUN rm opencv.zip && rm opencv_contrib.zip


# Build OPENCV
RUN cd ~/opencv/ && mkdir build && cd build
RUN cmake -D CMAKE_BUILD_TYPE=RELEASE \
        -D CMAKE_INSTALL_PREFIX=/usr/local \
        -D OPENCV_EXTRA_MODULES_PATH=~/opencv_contrib/modules \
        -D ENABLE_NEON=ON \
        -D WITH_FFMPEG=ON \
        -D WITH_GSTREAMER=ON \
        -D WITH_TBB=ON \
        -D BUILD_TBB=ON \
        -D BUILD_TESTS=OFF \
        -D WITH_EIGEN=OFF \
        -D WITH_V4L=ON \
        -D WITH_LIBV4L=ON \
        -D WITH_VTK=OFF \
        -D WITH_QT=OFF \
        -D OPENCV_ENABLE_NONFREE=ON \
        -D INSTALL_C_EXAMPLES=OFF \
        -D INSTALL_PYTHON_EXAMPLES=OFF \
        -D BUILD_NEW_PYTHON_SUPPORT=ON \
        -D BUILD_opencv_python3=TRUE \
        -D OPENCV_GENERATE_PKGCONFIG=ON \
        -D BUILD_EXAMPLES=OFF ..

RUN make -j4 && make install && ldconfig && apt-get update

# Setup Jada Application
# Get Jada Code
RUN git clone https://github.com/reddingk/Jada.git Jada

# Clean Extra Files Build Files
RUN rm /Jada/package.json && \
    rm /Jada/package-lock.json && \
    rm -r /Jada/jada_3/config/data/photoMemory

# Copy Build Files
COPY /dockerfiles/package.json /Jada/package.json
RUN mkdir -p /public

COPY /jada_3/config/data/imgModels /Jada/jada_3/config/data/imgModels
COPY /jada_3/config/data/photoMemory /Jada/jada_3/config/data/photoMemory
RUN mkdir -p /Jada/jada_3/fileCache

# Copy Env File
COPY /dockerfiles/.env /Jada/.env
COPY /dockerfiles/.env .env

# Remove Development Files
RUN rm -r /Jada/dockerfiles && \
    rm /Jada/Dockerfile && \
    rm /Jada/jadacmd.js && \
    rm /Jada/jadaEx.js

# Install Application Packages
RUN cd /Jada; npm install

# Run Application
EXPOSE  1003
#CMD ["node", "/Jada/server.js"]

