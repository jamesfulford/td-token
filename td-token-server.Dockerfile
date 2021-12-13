FROM node:12.16.3-alpine

WORKDIR /app
COPY yarn.lock initial-token-server.js package.json /app/
RUN yarn install --frozen-lockfile

ENTRYPOINT ["node", "initial-token-server.js"]
