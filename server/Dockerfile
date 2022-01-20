FROM node:lts-alpine AS build

WORKDIR /usr/src/app
COPY ./package* ./
RUN npm ci --only=production

COPY . .

EXPOSE 9615

CMD [ "npm", "start" ]
