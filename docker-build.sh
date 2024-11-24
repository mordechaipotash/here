#!/bin/bash

# Add Docker to PATH
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"

# Install dependencies and generate package-lock.json
npm install

# Build the image
docker build -t wotc-app .

# Run the container
docker run -p 3010:3000 wotc-app
