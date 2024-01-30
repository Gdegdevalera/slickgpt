FROM node:21

# install dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Copy all local files into the image.
COPY . .

RUN npm run build
RUN npm prune --production

###
# Only copy over the Node pieces we need
# ~> Saves 35MB
###
FROM node:slim

WORKDIR /app
COPY --from=0 /app/build build/
COPY --from=0 /app/node_modules node_modules/
COPY package.json .

EXPOSE 3000
CMD ["node", "build"]