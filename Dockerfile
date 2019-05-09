FROM node:10.15.3

WORKDIR /app

COPY ./ /app

EXPOSE 8080

ENV NAME World

RUN npm install

CMD ["npm", "start"];