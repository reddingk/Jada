#Download Alphine Linux
FROM alpine:3.10

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
  libx11-dev make musl nano openblas openblas-dev \
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

# Clean Up
RUN apk del curl wget unzip


# Setup Jada Application
# Get Jada Code
RUN git clone https://github.com/reddingk/Jada.git Jada

# Copy Build Files
RUN rm /Jada/package.json && \
    rm /Jada/package-lock.json && \
    rm -r /Jada/jada_3/config/data/photoMemory

COPY /dockerfiles/package.json /Jada/package.json
RUN mkdir -p /public

COPY /jada_3/config/data/imgModels /Jada/jada_3/config/data/imgModels
COPY /jada_3/config/data/photoMemory /Jada/jada_3/config/data/photoMemory
RUN mkdir -p /jada_3/fileCache

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
CMD ["node", "/Jada/server.js"]