# Download opencv nodejs Ubuntu
FROM justadudewhohacks/opencv-nodejs

# Update Container
RUN sudo apt update

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


