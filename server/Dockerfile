FROM node:16-buster-slim AS build

WORKDIR /usr/src/app
COPY ./package* ./
RUN npm ci --only=production

COPY . .

EXPOSE 9615

CMD [ "npm", "start" ]
