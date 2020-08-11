/*** Install OpenCV Nodejs ***/
https://www.npmjs.com/package/opencv4nodejs
/*****************************/


1) Install CMake
   https://cmake.org/download/

2) Install windows build tools (As Admin)
   npm install --global windows-build-tools

3) Auto Build OpenCV
   npm install --save opencv4nodejs

/*** BUILD DOCKERFILE ***/
*] BUILD Container:
   docker build .
   docker build -t jada:0.951 .

*] View Images
   docker images

*] View Containers
   docker ps -a

*] Run Container
   docker run -t -i (NAME)

*] Mount Folder

   docker run -v (LOCAL PATH):(VM PATH)

   docker run -v c:/Users/krisr/Documents/Development/Personal/Jada/localConfig:/jada/localConfig -t -i jada:0.9

*] Expose Port
   docker run -p <HOST_PORT>:<CONTAINER:PORT> IMAGE_NAME

*] Start Container
   docker start <CONTAINER>

*] Save Image
   docker save jada:0.951 > jada_0_951.tar

-- OFFICIAL --
docker run -p 1003:1003 -v c:/Users/krisr/Documents/Development/Personal/Jada/localConfig:/jada/localConfig -t -i jada:0.95

docker load < /media/usb/naratifla_0_951.tar
docker load < /media/usb/jada_0_951.tar