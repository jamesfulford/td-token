FROM node:12.16.3-alpine

WORKDIR /app
COPY yarn.lock index.js package.json /app/
RUN yarn install --frozen-lockfile

ENTRYPOINT ["node", "index.js"]