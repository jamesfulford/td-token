FROM node:12.16.3-alpine

WORKDIR /app
COPY yarn.lock refresh-tokens.js package.json /app/
RUN yarn install --frozen-lockfile

ENTRYPOINT ["node", "refresh-tokens.js"]
