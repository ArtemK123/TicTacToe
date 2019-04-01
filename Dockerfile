FROM node:10.15.3

WORKDIR /app

COPY . /app

EXPOSE 8080

ENV NAME World

CMD ["node", "server.js"]